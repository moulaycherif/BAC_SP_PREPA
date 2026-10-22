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

// 📸 NOUVELLE ROUTE : Correspond à axios.post('/api/ai/scan-correct', ...) dans le frontend
router.post("/scan-correct", authenticateStudent, upload.single("file"), scanAndCorrect);

export default router;