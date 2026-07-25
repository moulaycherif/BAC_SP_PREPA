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

// 👇 AJOUT : On importe le middleware qui décode le jeton Admin
import { authenticateAdmin } from "../middleware/authAdmin"; 

const router = express.Router();

const aiController = require('../controllers/aiController');
const { upload } = require('../utils/multerConfig');
const { verifyAdmin } = require('../middleware/verifyAdmin');

// 👇 CORRECTION : Ajout de authenticateAdmin avant verifyAdmin
router.post('/generate-from-pdf', authenticateAdmin, verifyAdmin, upload.single('file'), aiController.generateQcmFromPdf);

// 👇 CORRECTION : Ajout des protections Admin sur l'import Excel
router.post("/import", authenticateAdmin, verifyAdmin, upload.single("file"), importExcel);

// 📄 Questions (filtrables) 
// 🔒 ON GARDE LA PROTECTION ICI : Seuls les étudiants connectés/invités voient les questions
router.get("/", authenticateStudent, getQuestions);

// 🔓 ON RETIRE LA PROTECTION ICI : Permet à l'Admin d'afficher les menus déroulants
router.get("/exams", getExams);
router.get("/exams/blancs", getConcoursBlancs);
router.get("/subjects/:exam", getSubjectsByExam);

// 👇 CORRECTION : Ajout des protections Admin sur la suppression
router.delete("/all", authenticateAdmin, verifyAdmin, deleteAllQuestions);

export default router;