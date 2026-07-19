// controllers/rankingController.ts
import { Response } from "express";
import { getRankingByQcm } from "../services/rankingService";
// 🚨 NOUVEAU : Alignement du type de requête
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function getRanking(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { qcmId } = req.params;
    if (!qcmId) {
      res.status(400).json({ message: "qcmId manquant" });
      return;
    }

    // Garde-fou au cas où blockGuest ne serait pas mis sur la route
    if (req.student?.role === "guest") {
      res.json([]);
      return;
    }

    const ranking = await getRankingByQcm(qcmId);
    res.json(ranking);
  } catch (error) {
    console.error("Erreur getRanking:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}