import express from "express";
import multer from "multer";
import { generateContentFromPdf, importCorrectedExcel, verifyAnswer } from "../controllers/aiController";
import { authenticateStudent } from "../middleware/authMiddleware";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Route pour générer du contenu (QCM, Cours, etc.) à partir d'un PDF
router.post("/generate", upload.single("file"), generateContentFromPdf);

// Route pour importer un fichier Excel
router.post("/import-excel", upload.single("file"), importCorrectedExcel);

// 🤖 Route de vérification des réponses d'exercices à saisie libre / mathématique
router.post("/verify-answer", authenticateStudent, verifyAnswer);

export default router;