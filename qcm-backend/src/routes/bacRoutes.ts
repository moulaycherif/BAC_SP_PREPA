// routes/bacRoutes.ts
import { Router } from "express";
import multer from "multer";
import { 
  getFilters, 
  getExercisesByFilters, 
  createBacExercise,
  correctStudentCopy 
} from "../controllers/bacController";

const router = Router();

// Configuration de Multer pour garder l'image en RAM (Buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Routes existantes
router.get("/filters", getFilters);
router.get("/exercises", getExercisesByFilters);
router.post("/exercises", createBacExercise);

// 🚀 NOUVELLE ROUTE : Phase 4 - L'examinateur IA
// On attend un fichier nommé "image" et un champ "exerciseId" dans le corps de la requête (FormData)
router.post("/correct", upload.single("image"), correctStudentCopy);

export default router;