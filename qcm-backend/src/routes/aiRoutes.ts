import express from "express";
import multer from "multer";
import { 
  generateContentFromPdf, 
  importCorrectedExcel, 
  verifyAnswer,
  scanAndCorrect,          
  scanAndCorrectExercise   
} from "../controllers/aiController";
import { authenticateStudent } from "../middleware/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/generate", upload.single("file"), generateContentFromPdf);
router.post("/import-excel", upload.single("file"), importCorrectedExcel);
router.post("/verify-answer", authenticateStudent, verifyAnswer);

// Route Scan & Correct classique (question unique)
router.post("/scan-correct", 
  authenticateStudent, 
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(500).json({ error: "Erreur Multer", details: err.message });
      next();
    });
  }, 
  scanAndCorrect
);

// NOUVELLE ROUTE : Scan & Correct global (Exercice complet)
router.post("/scan-correct-exercise",
  authenticateStudent,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(500).json({ error: "Erreur Multer", details: err.message });
      next();
    });
  },
  scanAndCorrectExercise
);

export default router;