// routes/statsRoutes.ts
import express from "express";
import {
  getStudentStats,
  getQcmStats,
  getActivityStats,
  getSuccessEvolution,
} from "../controllers/statsController";

// 🚨 MODIFIÉ : On importe aussi blockGuest
import { authenticateStudent, blockGuest } from "../middleware/authMiddleware"; 

const router = express.Router();

// 📊 Dashboard complet (🔒 Bloqués pour l'invité)(On retire le blocage)
router.get("/student", authenticateStudent, getStudentStats);
router.get("/qcm", authenticateStudent, getQcmStats);
router.get("/activity", authenticateStudent, getActivityStats);
router.get("/success-evolution", authenticateStudent, getSuccessEvolution);

export default router;