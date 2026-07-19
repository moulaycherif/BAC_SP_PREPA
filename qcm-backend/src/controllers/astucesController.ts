import Astuce from "../models/Astuce";
import { Response } from "express";
import { supabase } from "../config/supabase";
// 🚨 NOUVEAU : Importation du bon type de requête
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/* 🔵 ASTUCES PAR CHAPITRE */
export const getAstucesByChapter = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chapter } = req.params;

    const astuces = await Astuce.find({
      chapter: { $regex: chapter.trim(), $options: "i" },
    });
    
    const safeAstuces = astuces.map((tip: any) => ({
      _id: tip._id,
      subject: tip.subject,
      chapter: tip.chapter,
      title: tip.title,
      description: tip.description,
      pdfUrl: tip.pdfUrl,
      cases: (tip.cases || []).filter(Boolean),
    }));

    // 🟢 CORRECTION : On renvoie juste le 1er élément du tableau déjà nettoyé !
    if (req.student?.role === "guest") {
      return res.json(safeAstuces.slice(0, 1));
    }

    res.json(safeAstuces);
  } catch (error) {
    console.error("Erreur getAstucesByChapter:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* 🟢 CRÉATION ASTUCE (Protégée par le routeur) */
export const createAstuce = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, chapter, title, description, cases, pdfUrl } = req.body;

    if (!subject || !chapter || !title) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    const normalizedCases = (cases || [])
      .filter((c: any) =>
        c && (
          (c.content && c.content.trim() !== "") ||
          (c.explanation && c.explanation.trim() !== "") ||
          (c.image && c.image.trim() !== "")
        )
      )
      .map((c: any) => ({
        title: c.title || "",
        content: c.content || c.explanation || "",
        explanation: c.explanation || c.content || "",
        example: c.example || "",
        image: c.image || "", 
      }));

    const astuce = new Astuce({
      subject,
      chapter,
      title,
      description,
      cases: normalizedCases,
      pdfUrl: pdfUrl || null,
    });

    await astuce.save();
    res.status(201).json(astuce);
  } catch (error) {
    console.error("Erreur createAstuce:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* 📄 UPLOAD PDF (Protégée par le routeur) */
export const uploadAstucePdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier" });
    }

    const fileName = `astuces/${Date.now()}-${req.file.originalname}`;

    const { error } = await supabase.storage
      .from("astuces")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Erreur upload" });
    }

    const { data } = supabase.storage
      .from("astuces")
      .getPublicUrl(fileName);

    res.json({ pdfUrl: data.publicUrl });
  } catch (error) {
    console.error("❌ Upload PDF:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};