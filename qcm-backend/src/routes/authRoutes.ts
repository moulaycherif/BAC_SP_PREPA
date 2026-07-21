import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin";
import Student from "../models/Student";

// 🛡️ Vos middlewares de sécurité
import { authenticateAdmin } from "../middleware/authAdmin"; 
import { authenticateStudent } from "../middleware/authMiddleware";

// 📦 Importation de TOUTES les fonctions centralisées et sécurisées du contrôleur
// 👈 CORRECTION 1 : loginGuest ajouté proprement dans cette liste
import { 
  loginStudent, 
  logoutStudent, 
  loginAdmin,   
  logoutAdmin,  
  createStudent, 
  getStudents, 
  deleteStudent,
  loginGuest 
} from "../controllers/authController";

dotenv.config();
const router = express.Router();

// ==========================================
// 🔑 ROUTES ADMINISTRATEUR (ADMIN)
// ==========================================

router.post("/create-admin", async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) return res.json({ message: "Admin déjà existant ✅" });

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
    const admin = new Admin({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      currentSessionId: null, 
      currentIp: null
    });
    await admin.save();
    res.json({ message: "Admin créé ✅", admin });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur lors de la création initiale de l'admin" });
  }
});

router.post("/admin/login", loginAdmin);
router.post("/admin/logout", authenticateAdmin, logoutAdmin);

// ==========================================
// 🎓 ROUTES ÉTUDIANTS (STUDENT) & PANEL ADMIN
// ==========================================

router.post("/login", loginStudent);
router.post("/logout", authenticateStudent, logoutStudent);

// 🛠️ Gestion des étudiants par l'administrateur
router.get("/students", authenticateAdmin, getStudents);
router.post("/students", authenticateAdmin, createStudent);
router.delete("/students/:id", authenticateAdmin, deleteStudent);

// 🚀 Route pour la Démo
router.post("/guest", loginGuest);

// ==========================================
// 🛡️ VÉRIFICATION DE SESSION (/me)
// ==========================================
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Non authentifié" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "votre_secret_jwt_super_securise") as any;
    
    if (decoded.isAdmin) {
      // Vérification côté Admin
      const admin = await Admin.findById(decoded.userId);
      if (!admin || admin.currentSessionId !== decoded.sessionId) {
        return res.status(403).json({ code: "SESSION_KICKED", error: "Session admin invalide" });
      }
      return res.json({ id: admin._id, name: admin.name, email: admin.email, isAdmin: true });
      
    } else if (decoded.isGuest) {
      // 👈 CORRECTION 2 : On valide l'invité directement sans chercher dans la base !
      return res.json({ 
        id: decoded.userId, 
        name: "Invité", 
        email: "demo@med-contest.com", 
        isAdmin: false,
        isGuest: true 
      });

    } else {
      // Vérification côté Étudiant
      const student = await Student.findById(decoded.userId);
      if (!student || student.currentSessionId !== decoded.sessionId) {
        return res.status(403).json({ code: "SESSION_KICKED", error: "Session étudiante invalide" });
      }
      return res.json({ 
        id: student._id, 
        name: student.name, 
        email: student.email, 
        isAdmin: false,
        isGuest: false,
        options: (student as any).options || [] // 👈 AJOUT ICI
      });
    }
  } catch (err) {
    return res.status(401).json({ error: "Session expirée ou invalide" });
  }
});

export default router;