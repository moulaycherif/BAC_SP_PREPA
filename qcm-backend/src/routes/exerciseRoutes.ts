// routes/exerciseRoutes.ts
import express, { Request, Response } from "express";
import Exercise from "../models/Exercise";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { authenticateAdmin } from "../middleware/authAdmin";
// 🚨 NOUVEAU : On importe le middleware étudiant et son type
import { authenticateStudent, AuthenticatedRequest } from "../middleware/authMiddleware";

import multer from "multer";
import path from "path";
import fs from "fs";
import xlsx from "xlsx";

const router = express.Router();

// Configuration Multer standard pour les images
const uploadDir = path.join(process.cwd(), "uploads", "exercises");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });
// Configuration Multer pour l'import en mémoire temporaire
const excelUpload = multer({ storage: multer.memoryStorage() });

// 🛠️ FONCTION MAGIQUE DE CONVERSION LATEX POUR EXCEL
// Transforme automatiquement les $...$ d'Excel en \(...\) lisibles par le site Étudiant
const formatExcelMath = (text: any) => {
  if (!text) return "";
  let str = String(text);
  // 1. Convertit les blocs mathématiques $$...$$ en \[...\]
  str = str.replace(/\$\$(.*?)\$\$/g, "\\[$1\\]");
  // 2. Convertit les mathématiques en ligne $...$ en \(...\)
  str = str.replace(/\$([^$]+)\$/g, "\\($1\\)");
  return str;
};

// ======================================================
// 📋 Récupérer tous les exercices (Bridé pour l'invité)
// ======================================================
router.get("/", authenticateStudent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 🔍 Si c'est un invité, on ne lui donne que 2 exercices échantillons
    if (req.student?.role === "guest") {
      const sampleExercises = await Exercise.find().limit(2);
      return res.json(sampleExercises);
    }

    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ======================================================
// 📋 Récupérer TOUS les exercices (DÉDIÉ À L'ADMIN)
// ======================================================
router.get("/admin/all", authenticateAdmin, verifyAdmin, async (req: Request, res: Response) => {
  try {
    // L'admin a besoin de tout voir, sans aucune limite ni restriction d'invité
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la récupération admin" });
  }
});

// ======================================================
// 🖼 Upload d'image depuis l'éditeur riche (Quill)
// ======================================================
router.post("/upload-editor-image", authenticateAdmin, verifyAdmin, upload.single("image"), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: "Aucun fichier uploadé" });
    return;
  }
  res.json({ url: `/uploads/exercises/${req.file.filename}` });
});

// ======================================================
// ➕ Ajouter un exercice manuel
// ======================================================
router.post("/", authenticateAdmin, verifyAdmin, upload.single("contextImage"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, chapter, contextText, subQuestions } = req.body;
    let parsedSubQuestions = subQuestions;

    if (typeof subQuestions === "string") {
      try {
        parsedSubQuestions = JSON.parse(subQuestions);
      } catch (e) {
        res.status(400).json({ error: "Format des sous-questions invalide" });
        return;
      }
    }

    parsedSubQuestions = parsedSubQuestions.filter((q: any) => q.questionText && q.questionText.trim() !== "");
    if (parsedSubQuestions.length === 0) {
      res.status(400).json({ error: "Au moins une sous-question est requise" });
      return;
    }

    const exercise = await Exercise.create({
      subject,
      chapter,
      contextText,
      contextImage: req.file ? `/uploads/exercises/${req.file.filename}` : "",
      subQuestions: parsedSubQuestions,
    });

    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la création" });
  }
});

// ======================================================
// 📥 Importation fichier Excel (.xlsx / .xls) - MULTI-QUESTIONS INTELLIGENT
// ======================================================
router.post("/import-excel", authenticateAdmin, verifyAdmin, excelUpload.single("excelFile"), async (req: Request, res: Response): Promise<any> => {
  try {
    const { subject, chapter } = req.body;
    if (!req.file) return res.status(400).json({ error: "Fichier manquant" } as any);
    if (!subject || !chapter) return res.status(400).json({ error: "Matière et chapitre obligatoires" } as any);

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetData: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    if (sheetData.length === 0) return res.status(400).json({ error: "Fichier vide" } as any);

    const exercisesToSave: any[] = [];
    let currentExercise: any = null;
    let currentEnonceText = ""; 

    for (const row of sheetData) {
      const cleanRow: any = {};
      Object.keys(row).forEach((key) => {
        // 🪄 Nettoyage total des accents et espaces pour les noms de colonnes
        const cleanKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s_\-\r\n\t]/g, "");
        cleanRow[cleanKey] = row[key];
      });

      const rawEnonce = String(cleanRow["enonce"] || cleanRow["contexte"] || "").trim();
      const questionText = formatExcelMath(cleanRow["question"] || cleanRow["text"] || "");
      const typeQuestion = String(cleanRow["type"] || "qcm").toLowerCase().trim();
      const imageCol = String(cleanRow["image"] || cleanRow["img"] || "").trim();

      // 🧠 1. SAUVEGARDE DU CONTEXTE (Même si la ligne n'a pas de question !)
      if (rawEnonce !== "") {
        // Si on lit un nouvel énoncé, on archive le groupe de questions précédent
        if (currentExercise && rawEnonce !== currentEnonceText) {
          exercisesToSave.push(currentExercise);
          currentExercise = null;
        }
        currentEnonceText = rawEnonce;
      }

      // 🚫 2. Si pas de question, on s'arrête là pour cette ligne
      if (!questionText || questionText.trim() === "") continue;

      // 🎯 3. Traitement des options
      let optionsArray: string[] = [];
      if (typeQuestion === "vrai_faux") {
        optionsArray = ["Vrai", "Faux"];
      } else {
        const optA = cleanRow["optiona"] || cleanRow["opta"] || "";
        const optB = cleanRow["optionb"] || cleanRow["optb"] || "";
        const optC = cleanRow["optionc"] || cleanRow["optc"] || "";
        const optD = cleanRow["optiond"] || cleanRow["optd"] || "";
        const optE = cleanRow["optione"] || cleanRow["opte"] || ""; 
        optionsArray = [optA, optB, optC, optD, optE].map(o => formatExcelMath(String(o).trim())).filter(o => o !== "undefined" && o !== "");
      }
      if (optionsArray.length < 2) optionsArray = ["Option A par défaut", "Option B par défaut"];

      let bonneReponseRaw = cleanRow["bonnereponse"] || cleanRow["correctanswer"] || cleanRow["reponsecorrecte"] || cleanRow["reponse"] || "";
      let correctAnswerText = formatExcelMath(String(bonneReponseRaw).trim());
      if (!correctAnswerText && optionsArray.length > 0) correctAnswerText = optionsArray[0];

      const subQuestion = {
        questionText,
        qType: typeQuestion === "vrai_faux" ? "vrai_faux" : "qcm",
        options: optionsArray,
        correctAnswer: correctAnswerText,
        explanation: formatExcelMath(cleanRow["explication"] || cleanRow["explanation"] || ""),
        image: imageCol
      };

      // 🧠 4. ATTACHEMENT DE LA QUESTION AU CONTEXTE
      if (!currentExercise) {
        currentExercise = {
          subject,
          chapter,
          contextText: formatExcelMath(currentEnonceText || "Contexte général"),
          contextImage: imageCol,
          subQuestions: [subQuestion]
        };
      } else {
        currentExercise.subQuestions.push(subQuestion);
      }
    }

    if (currentExercise) exercisesToSave.push(currentExercise);

    if (exercisesToSave.length > 0) {
      await Exercise.insertMany(exercisesToSave);
    }

    res.status(200).json({ success: true, message: `Importation réussie : ${exercisesToSave.length} énoncés créés.` } as any);
  } catch (error) {
    console.error("Erreur import Excel :", error);
    res.status(500).json({ error: "Erreur interne lors du traitement." } as any);
  }
});

// ======================================================
// 🔍 Filtrer par matière (Bridé pour l'invité)
// ======================================================
router.get("/by-subject/:subject", authenticateStudent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.student?.role === "guest") {
      const sample = await Exercise.find({ subject: req.params.subject }).limit(1);
      return res.json(sample);
    }

    const exercises = await Exercise.find({ subject: req.params.subject });
    res.json(exercises);
  } catch (error) { res.status(500).json({ error: "Erreur" }); }
});

// ======================================================
// 🔍 Filtrer par chapitre (Bridé pour l'invité)
// ======================================================
router.get("/:subject/:chapter", authenticateStudent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.student?.role === "guest") {
      const sample = await Exercise.find({ subject: req.params.subject, chapter: req.params.chapter }).limit(1);
      return res.json(sample);
    }

    const exercises = await Exercise.find({ subject: req.params.subject, chapter: req.params.chapter });
    res.json(exercises);
  } catch (error) { res.status(500).json({ error: "Erreur" }); }
});

router.delete("/:id", authenticateAdmin, verifyAdmin, async (req: Request, res: Response) => {
  try {
    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erreur" }); }
});

export default router;