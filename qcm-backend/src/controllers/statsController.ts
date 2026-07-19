// controllers/statsController.ts
import { Response } from "express";
import mongoose from "mongoose";
import StudentActivity from "../models/StudentActivity";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// 📊 QCM PAR MATIÈRE
export const getQcmStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 🛡️ Mode invité : On renvoie des données fictives pour que le front liste les matières correctement
    if (req.student?.role === "guest") {
      return res.json([
        { _id: "Physique", count: 12 },
        { _id: "Chimie", count: 8 },
        { _id: "SVT", count: 15 }
      ]);
    }

    const student = new mongoose.Types.ObjectId(req.student!._id);
    const stats = await StudentActivity.aggregate([
      { $match: { student, type: "QCM" } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(stats);
  } catch (error) {
    console.error("❌ getQcmStats :", error);
    res.status(500).json({ message: "Erreur récupération statistiques QCM" });
  }
};

// 📈 ACTIVITÉ DANS LE TEMPS
export const getActivityStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.student?.role === "guest") return res.json([]); 

    const student = new mongoose.Types.ObjectId(req.student!._id);
    const stats = await StudentActivity.aggregate([
      { $match: { student } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(stats);
  } catch (error) {
    console.error("❌ getActivityStats :", error);
    res.status(500).json({ message: "Erreur récupération activité" });
  }
};

// 🧠 DASHBOARD COMPLET
export const getStudentStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 🛡️ Mode invité : Structure miroir complète peuplée avec de la Physique et de la Chimie
    if (req.student?.role === "guest") {
      return res.json({
        qcmBySubject: [
          { _id: "Physique", count: 12 },
          { _id: "Chimie", count: 8 },
          { _id: "SVT", count: 15 }
        ],
        timeline: [],
        resources: [
          { _id: "QCM", count: 35 }
        ],
        ranking: [],
        successEvolution: [
          { _id: { subject: "Physique", date: "2026-01-01" }, avgSuccess: 75 },
          { _id: { subject: "Chimie", date: "2026-01-01" }, avgSuccess: 60 }
        ],
      });
    }

    const student = new mongoose.Types.ObjectId(req.student!._id);

    const qcmBySubject = await StudentActivity.aggregate([
      { $match: { student, type: "QCM" } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const timeline = await StudentActivity.aggregate([
      { $match: { student } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const resources = await StudentActivity.aggregate([
      { $match: { student } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const ranking = await StudentActivity.aggregate([
      { $match: { type: "QCM" } },
      { $group: { _id: "$student", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    const successEvolution = await StudentActivity.aggregate([
      { $match: { student, type: { $in: ["QCM", "EXERCISE"] } } },
      { $group: { _id: { subject: "$subject", date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }, avgSuccess: { $avg: "$successRate" } } },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ qcmBySubject, timeline, resources, ranking, successEvolution });
  } catch (error) {
    console.error("❌ getStudentStats :", error);
    res.status(500).json({ message: "Erreur récupération statistiques étudiant" });
  }
};

// 📈 ROUTE DÉDIÉE ÉVOLUTION DES RÉSULTATS
export const getSuccessEvolution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.student?.role === "guest") {
      return res.json([
        { _id: { subject: "Physique", date: "2026-01-01" }, avgSuccess: 75 }
      ]);
    }

    const student = new mongoose.Types.ObjectId(req.student!._id);
    const stats = await StudentActivity.aggregate([
      { $match: { student, type: { $in: ["QCM", "EXERCISE"] } } },
      { $group: { _id: { subject: "$subject", date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }, avgSuccess: { $avg: "$successRate" } } },
      { $sort: { "_id.date": 1 } },
    ]);
    res.json(stats);
  } catch (error) {
    console.error("❌ getSuccessEvolution :", error);
    res.status(500).json({ message: "Erreur récupération évolution réussite" });
  }
};