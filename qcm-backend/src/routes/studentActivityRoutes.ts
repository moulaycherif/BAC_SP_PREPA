// routes/studentActivityRoutes.ts
import express from "express";
// 🚨 MODIFIÉ : Import de blockGuest
import { authenticateStudent, blockGuest } from "../middleware/authMiddleware";
import { createStudentActivity } from "../controllers/studentActivityController";

const router = express.Router();

// 🔒 Pas d'enregistrement d'activité pour le mode démo (On retire blockGuest)
router.post("/", authenticateStudent, createStudentActivity);

export default router;