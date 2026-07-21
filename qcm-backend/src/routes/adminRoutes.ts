import express from "express";
import bcrypt from "bcryptjs";
import Student from "../models/Student";
import { authenticateAdmin } from "../middleware/authAdmin";

const router = express.Router();

console.log("AdminRoutes :",Student);

router.get("/ping", (req, res) => {
  res.json({ message: "pong admin" });
});

// 🔹 Créer un étudiant (ADMIN)
router.post("/create-student", authenticateAdmin, async (req, res) => {
  try {
    // 1️⃣ On récupère 'options' depuis req.body
    const { name, email, password, options } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2️⃣ On ajoute 'options' lors de la création de l'étudiant
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      options: options || [], // 👈 AJOUT ICI (avec un tableau vide par défaut au cas où)
    });

    await student.save();

    res.json({ message: "Étudiant créé ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Liste de tous les étudiants (protégée admin)
router.get("/students", authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.find().select("-password"); // sans les mots de passe
    res.json(students);
  } catch (err) {
    console.error("Erreur récupération étudiants :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des étudiants" });
  }
});

// 🔹 Supprimer un étudiant
router.delete("/students/:id", authenticateAdmin, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ Étudiant supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

// 🔹 Mettre à jour un étudiant existant (ADMIN)
router.put("/students/:id", authenticateAdmin, async (req, res) => {
  try {
    const { name, email, options } = req.body;

    // On cherche l'étudiant et on met à jour ses informations
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          name, 
          email, 
          options: options || [] 
        } 
      },
      { new: true } // Retourne le document mis à jour
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Étudiant introuvable" });
    }

    res.json({ message: "✅ Options mises à jour avec succès !" });
  } catch (err) {
    console.error("Erreur mise à jour :", err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour" });
  }
});

export default router;
