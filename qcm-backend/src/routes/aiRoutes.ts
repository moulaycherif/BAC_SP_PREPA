import express from "express";
import multer from "multer";
import { generateContentFromPdf, importCorrectedExcel } from "../controllers/aiController";

const router = express.Router();

// Configuration de multer pour stocker le fichier en mémoire avant traitement
const upload = multer({ storage: multer.memoryStorage() });

// Route pour générer du contenu (QCM, Cours, etc.) à partir d'un PDF
router.post("/generate", upload.single("file"), generateContentFromPdf);

// Route pour importer un fichier Excel (généré par l'IA et potentiellement corrigé par le prof)
router.post("/import-excel", upload.single("file"), importCorrectedExcel);

export default router;