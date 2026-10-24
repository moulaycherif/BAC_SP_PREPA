import express from "express";
import multer from "multer";
import { generateContentFromPdf, importCorrectedExcel, verifyAnswer, scanAndCorrect } from "../controllers/aiController";
import { authenticateStudent } from "../middleware/authMiddleware";

const router = express.Router();

// Configuration de multer pour stocker le fichier en mémoire (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Route pour générer du contenu (QCM, Cours, etc.) à partir d'un PDF
router.post("/generate", upload.single("file"), generateContentFromPdf);

// Route pour importer un fichier Excel
router.post("/import-excel", upload.single("file"), importCorrectedExcel);

// 🤖 Route de vérification des réponses d'exercices à saisie libre / mathématique
router.post("/verify-answer", authenticateStudent, verifyAnswer);

// 📸 ROUTE SÉCURISÉE AVEC DEBUGGING (Scan & Correct)
router.post("/scan-correct", 
  (req, res, next) => {
    next();
  },
  authenticateStudent, 
  (req, res, next) => {
    next();
  },
  (req, res, next) => {
    // Interception des erreurs Multer
    const multerUpload = upload.single("file");
    multerUpload(req, res, (err) => {
      if (err) {
        console.error("❌ [DEBUG 3 - ERREUR MULTER] :", err.message);
        return res.status(500).json({ error: "Erreur lors du traitement du fichier", details: err.message });
      }
      next();
    });
  }, 
  scanAndCorrect
);

export default router;