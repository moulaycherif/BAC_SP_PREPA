// routes/rankingRoutes.ts
import { Router } from "express";
import { getRanking } from "../controllers/rankingController";
// 🚨 NOUVEAU : Import des verrous de sécurité
import { authenticateStudent, blockGuest } from "../middleware/authMiddleware";

const router = Router();

// 🔒 Seuls les vrais étudiants abonnés peuvent voir et participer au classement
router.get("/:qcmId", authenticateStudent, blockGuest, getRanking);

export default router;