import express from "express";
import multer from "multer";
import {
  getQuestions,
  importExcel,
  getExams,
  getConcoursBlancs,
  getSubjectsByExam,
  deleteAllQuestions,
} from "../controllers/questionController";
import { authenticateStudent } from "../middleware/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 📥 Import Excel
router.post("/import", upload.single("file"), importExcel);

// 📄 Questions (filtrables) 
// 🔒 ON GARDE LA PROTECTION ICI : Seuls les étudiants connectés/invités voient les questions
router.get("/", authenticateStudent, getQuestions);

// 🔓 ON RETIRE LA PROTECTION ICI : Permet à l'Admin d'afficher les menus déroulants
router.get("/exams", getExams);
router.get("/exams/blancs", getConcoursBlancs);
router.get("/subjects/:exam", getSubjectsByExam);

// 🧹 Suppression globale
router.delete("/all", deleteAllQuestions);

export default router;