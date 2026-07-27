import express from "express";
import {
  getQuestions,
  importExcel,
  getExams,
  getConcoursBlancs,
  getSubjectsByExam,
  deleteAllQuestions,
} from "../controllers/questionController";
import { authenticateStudent } from "../middleware/authMiddleware";
import { authenticateAdmin } from "../middleware/authAdmin"; 

const router = express.Router();
// Import du nouveau contrôleur IA
const aiController = require('../controllers/aiController');
const { upload } = require('../utils/multerConfig');
const { verifyAdmin } = require('../middleware/verifyAdmin');

// 👇 Route IA mise à jour pour être générique
router.post('/generate-from-pdf', authenticateAdmin, verifyAdmin, upload.single('file'), aiController.generateContentFromPdf);

// Import Excel
router.post("/import", authenticateAdmin, verifyAdmin, upload.single("file"), importExcel);

// Questions (Étudiants)
router.get("/", authenticateStudent, getQuestions);

// Menus déroulants
router.get("/exams", getExams);
router.get("/exams/blancs", getConcoursBlancs);
router.get("/subjects/:exam", getSubjectsByExam);

// Suppression
router.delete("/all", authenticateAdmin, verifyAdmin, deleteAllQuestions);

export default router;