// routes/tipRoutes.ts
import express from "express";
import Tip from "../models/Tip";
// 🚨 MODIFIÉ : On importe le type AuthenticatedRequest pour lire le rôle
import { authenticateStudent, AuthenticatedRequest } from "../middleware/authMiddleware";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = express.Router();

// ➕ Créer une astuce (ADMIN)
router.post("/", authenticateStudent, verifyAdmin, async (req, res) => {
  const tip = await Tip.create(req.body);
  res.status(201).json(tip);
});

// 📚 Astuces par matière (🟢 Échantillon pour l'invité)
router.get("/by-subject/:subject", authenticateStudent, async (req: AuthenticatedRequest, res) => {
  try {
    // 👁️ Mode Démo : On ne renvoie qu'une seule astuce pour l'aperçu
    if (req.student?.role === "guest") {
      const sampleTip = await Tip.find({ subject: req.params.subject }).limit(1);
      return res.json(sampleTip);
    }

    res.json(await Tip.find({ subject: req.params.subject }));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔍 Détail d’une astuce (🔒 Sécurisé)
router.get("/:id", authenticateStudent, async (req: AuthenticatedRequest, res) => {
  try {
    // Un invité peut lire le détail d'une astuce s'il a cliqué sur son unique échantillon
    res.json(await Tip.findById(req.params.id));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;