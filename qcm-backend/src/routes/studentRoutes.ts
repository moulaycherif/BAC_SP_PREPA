// routes/studentRoutes.ts
import express from "express";
// 🚨 MODIFIÉ : On importe aussi blockGuest
import { authenticateStudent, blockGuest, AuthenticatedRequest } from "../middleware/authMiddleware";
import Exam from "../models/Exam";
import Result from "../models/Result";
import Question from "../models/Question";
import StudentActivity from "../models/StudentActivity";

const router = express.Router();

// 🔹 Profil étudiant (🟢 Accessible en démo)
router.get("/profile", authenticateStudent, async (req: AuthenticatedRequest, res) => {
  res.json({
    id: req.student!._id,
    name: req.student!.name,
    email: req.student!.email,
  });
});

// 🔹 Liste des examens disponibles (🟢 Accessible en démo pour montrer le catalogue)
router.get("/exams", authenticateStudent, async (req: AuthenticatedRequest, res) => {
  try {
    const exams = await Exam.find().select("title date");
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Questions pour un examen (🟢 Accessible en démo pour tester l'interface de QCM)
router.get("/exams/:examId/questions", authenticateStudent, async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) return res.status(404).json({ error: "Examen introuvable" });

  const questions = await Question.find({ exam: exam.title });

  res.json(questions);
});

// 🔹 Soumettre les réponses d’un examen (🔒 BLOQUÉ POUR L'INVITÉ)
// 💡 On insère 'blockGuest' pour empêcher l'écriture en base de données
router.post("/exams/:examId/submit", authenticateStudent, blockGuest, async (req, res) => {
  try {
    const examId = req.params.examId;
    const studentId = req.student!._id.toString();
    const { answers } = req.body;
    const subject = req.body.subject || "CONCOURS";   

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Examen introuvable" });

    const questions = await Question.find({ exam: exam.title });

    let score = 0;
    questions.forEach(q => {
      if (answers[q._id.toString()] === q.reponseCorrecte) {
        score += q.note || 1;
      }
    });

    await Result.create({
      studentId,
      examId,
      score,
    });

    await StudentActivity.create({
      student: req.student._id,   
      type: "QCM",
      subject,
      referenceId: examId,
    });

    res.json({ message: "Examen soumis ✅", score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Historique des résultats (🔒 BLOQUÉ POUR L'INVITÉ)
// 💡 Un invité n'a pas d'historique propre, on lui refuse l'accès proprement
router.get("/results", authenticateStudent, blockGuest, async (req: AuthenticatedRequest, res) => {
  try {
    const results = await Result.find({ student: req.student!._id }).populate("exam", "title date");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;