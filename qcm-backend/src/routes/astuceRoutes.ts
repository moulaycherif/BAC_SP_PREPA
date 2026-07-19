import { Router } from "express";
import {
  getAstucesByChapter,
  createAstuce,
  uploadAstucePdf
} from "../controllers/astucesController";
import Astuce from "../models/Astuce";
import { supabase } from "../config/supabase";
import multer from "multer";
import { authenticateStudent } from "../middleware/authMiddleware";
const upload = multer();
const router = Router();

/* 🔵 ADMIN — LISTE TOUTES LES ASTUCES */
router.get("/", async (req, res) => {
  try {
    const astuces = await Astuce.find().sort({
      subject: 1,
      chapter: 1,
      order: 1,
    });
    res.json(astuces);
  } catch (err) {
    res.status(500).json({ message: "Erreur chargement astuces" });
  }
});

/* 🟢 ADMIN — CRÉER UNE ASTUCE */

router.post("/", createAstuce);

router.post(
  "/upload-pdf",
  upload.single("file"), // 🔥 IMPORTANT
  (req, res, next) => {
    console.log("📥 Route upload PDF appelée");
    next();
  },
  uploadAstucePdf
);

router.post(
  "/upload-image",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier" });
      }

      // 🔥 Upload vers Supabase (comme PDF)
      const fileName = `${Date.now()}-${req.file.originalname}`;

      const { data, error } = await supabase.storage
        .from("astuces")
        .upload(`images/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("astuces")
        .getPublicUrl(`images/${fileName}`);

      res.json({ imageUrl: publicUrl.publicUrl });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur upload image" });
    }
  }
);

// 🔥 IMPORTANT : AVANT /:chapter
router.get("/detail/:id", async (req, res) => {
  try {

    const astuce = await Astuce.findById(req.params.id);

    if (!astuce) {
      return res.status(404).json({ message: "Astuce introuvable" });
    }

    return res.json(astuce); // 🔥 IMPORTANT
  } catch (err) {
    console.error("Erreur get astuce by id:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

/* 🟡 ÉTUDIANT — ASTUCES PAR CHAPITRE */
router.get("/:chapter", authenticateStudent, getAstucesByChapter);

export default router;
