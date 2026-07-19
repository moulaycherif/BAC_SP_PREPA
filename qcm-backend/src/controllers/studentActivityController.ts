// controllers/studentActivityController.ts
import { Response } from "express";
import StudentActivity from "../models/StudentActivity";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const createStudentActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      type,
      subject,
      chapter,
      referenceId,
      score,
      totalQuestions,
      successRate,
      duration,
      examId,
    } = req.body;

    // 🛡️ SÉCURITÉ & CORRECTION FRONT-END :
    // On ne stocke rien dans MongoDB, mais on renvoie l'exacte structure attendue par React
    if (req.student?.role === "guest") {
      return res.status(201).json({
        _id: `fake_act_${Date.now()}`, // Génération d'un faux ID temporaire
        student: req.student._id,
        type,
        subject, // Transmis en retour au Front-end pour préserver la matière (ex: Physique)
        chapter,
        referenceId,
        score,
        totalQuestions,
        successRate,
        duration,
        examId, // Préserve le concours actif
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Code standard pour les vrais étudiants inscrits
    const activity = await StudentActivity.create({
      student: req.student!._id,
      type,
      subject,
      chapter,
      referenceId,
      score,
      totalQuestions,
      successRate,
      duration,
      examId,
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error("❌ createStudentActivity:", error);
    res.status(500).json({
      message: "Erreur création activité",
    });
  }
};