import express from "express";
import multer from "multer";
import { 
  generateContentFromPdf, 
  importCorrectedExcel, 
  verifyAnswer,
  scanAndCorrect,          // AJOUT : indispensable car utilisé dans la route /scan-correct
  scanAndCorrectExercise   // AJOUT : votre nouvelle fonction
} from "../controllers/aiController";
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

// 📸 ROUTE SÉCURISÉE AVEC DEBUGGING (Scan & Correct - Question unique)
router.post("/scan-correct", 
  authenticateStudent, 
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

// 📸 NOUVELLE ROUTE : Scan & Correct global (Exercice complet)
router.post(
  "/scan-correct-exercise",
  authenticateStudent,
  (req, res, next) => {
    const multerUpload = upload.single("file");
    multerUpload(req, res, (err) => {
      if (err) {
        console.error("❌ [ERREUR MULTER - EXERCICE] :", err.message);
        return res.status(500).json({ error: "Erreur lors du traitement du fichier", details: err.message });
      }
      next();
    });
  },
  scanAndCorrectExercise
);

export default router;