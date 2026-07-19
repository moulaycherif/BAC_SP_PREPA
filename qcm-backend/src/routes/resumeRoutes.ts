import express from "express";

// 🚨 MODIFIÉ : On importe aussi blockGuest
import { authenticateStudent, blockGuest } from "../middleware/authMiddleware";   
import generateResumeBuffer from "../scripts/generateResume";
import Resume from "../models/resume";
import { supabase } from "../config/supabase";
import dotenv from "dotenv";
import { upload } from "../utils/multerConfig";
import { getResumesBySubject, getSignedResumeUrl } from "../controllers/resumeController";

dotenv.config();
const router = express.Router();

const bucket = process.env.SUPABASE_BUCKET!;

// 🟢 L'invité peut voir la liste pour découvrir l'interface
router.get("/by-subject/:subject", authenticateStudent, getResumesBySubject);

// 🔒 BLOCAGE TOTAL : L'invité ne peut pas obtenir le lien de téléchargement du vrai PDF
router.get("/signed/:id", authenticateStudent, blockGuest, getSignedResumeUrl);

// 🔒 BLOCAGE TOTAL : L'invité ne peut pas générer ou uploader de fichiers
router.post("/generate", authenticateStudent, blockGuest, upload.none(), async (req, res) => {
  // ... votre code de génération actuel ...
});

router.post("/upload", authenticateStudent, blockGuest, upload.single("file"), async (req, res) => {
  // ... votre code d'upload actuel ...
});

// ------------------------------------------------------
// 🟦  GÉNÉRER un PDF → upload Supabase → enregistrer Mongo
// ------------------------------------------------------
router.post("/generate", upload.none(), async (req, res) => {
  try {
    const { subject, chapter, content } = req.body;

    if (!subject || !chapter || !content) {
      return res.status(400).json({ error: "Champs manquants." });
    }

    const safeName = `${subject}_${chapter}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .trim() + ".pdf";

    // Vérifier si le fichier existe sur Supabase
    const { data: existing, error: listError } = await supabase.storage
      .from(bucket)
      .list("", { search: safeName });

    if (listError) {
      console.error("❌ Erreur list Supabase :", listError);
    }

    // Si le PDF existe déjà → on renvoie directement l'URL
   if (existing && existing.some((f) => f.name === safeName)) {
  const pdfUrl =
    `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${safeName}`;

  let resume = await Resume.findOne({ subject, chapter });
  if (!resume) {
    resume = await Resume.create({
      subject,
      chapter,
      pdfUrl,
      storagePath: safeName, // ✅ OBLIGATOIRE
    });
  }

  return res.json({
    success: true,
    pdfUrl,
    id: resume._id,
    alreadyExists: true,
  });
}

    // Générer PDF
    const pdfBuffer = await generateResumeBuffer(subject, chapter, content);

    // Upload vers Supabase (IMPORTANT : upsert=true)
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(safeName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Erreur upload Supabase :", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const pdfUrl =
      `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${safeName}`;

    let resume = await Resume.findOne({ subject, chapter });

if (!resume) {
  resume = await Resume.create({
    subject,
    chapter,
    pdfUrl,
    storagePath: safeName, // ✅
  });
} else {
  resume.pdfUrl = pdfUrl;
  resume.storagePath = safeName; // ✅
  await resume.save();
}


    return res.status(201).json({
      success: true,
      pdfUrl,
      id: resume._id,
    });

  } catch (err) {
    console.error("Erreur génération PDF :", err);
    return res.status(500).json({ error: "Erreur interne" });
  }
});

// ------------------------------------------------------
// 🟦  UPLOAD d’un PDF existant
// ------------------------------------------------------
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { subject, chapter } = req.body;
    const file = req.file;

    if (!subject || !chapter || !file) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const safeName = `${subject}_${chapter}`
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .trim() + ".pdf";

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(safeName, file.buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Erreur upload Supabase :", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const pdfUrl =
      `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${safeName}`;

    let resume = await Resume.findOne({ subject, chapter });

if (!resume) {
  resume = await Resume.create({
    subject,
    chapter,
    pdfUrl,
    storagePath: safeName, // ✅ OBLIGATOIRE
  });
} else {
  resume.pdfUrl = pdfUrl;
  resume.storagePath = safeName; // ✅
  await resume.save();
}

    return res.json({ success: true, pdfUrl });

  } catch (err) {
    console.error("Erreur upload PDF :", err);
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ------------------------------------------------------
// 🟦  Liste de tous les résumés
// ------------------------------------------------------
router.get("/all", async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ createdAt: -1 });
    return res.json(resumes);
  } catch (err) {
    console.error("Erreur fetch resumes :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// ------------------------------------------------------
// 🟦  Supprimer un résumé
// ------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    return res.json({ success: true });   
  } catch (err) {
    console.error("Erreur suppression résumé :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  } 
});

router.get("/by-chapter/:chapter", async (req, res) => {
  try {
    const chapter = req.params.chapter;

    const resumes = await Resume.find({
      chapter: { $regex: chapter, $options: "i" }
    }).sort({ createdAt: -1 });

    res.json(resumes);
  } catch (err) {
    console.error("❌ ERROR FETCH RESUMES:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
