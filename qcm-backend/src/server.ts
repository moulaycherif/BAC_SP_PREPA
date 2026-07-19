// 1️⃣ TOUJOURS EN PREMIER : Charger les variables d'environnement
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 

// 2️⃣ En second : Les modules externes et vos fichiers locaux
import express from "express";
import mongoose from "mongoose";
import app from "./app"; // Désormais, "app" aura accès aux vraies variables !
import http from "http";
import { initRankingSocket } from "./websocket/rankingSocket";
import path from "path";
import studentActivityRoutes from "./routes/studentActivityRoutes";
import { ensureUploadDirs } from "./utils/ensureUploadDirs";

import Admin from "./models/Admin";
import bcrypt from "bcrypt";

ensureUploadDirs();

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

app.use("/api/student-activity", studentActivityRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qcmdb";

console.log("✅ MONGO_URI utilisé :", MONGO_URI);

// 🔥 Création du serveur HTTP + WebSockets
const httpServer = http.createServer(app);
initRankingSocket(httpServer);

// 🛠️ FONCTION DE SEED AUTOMATIQUE
// Elle vérifie si la table admin est vide, et crée le compte avec le champ 'name' obligatoire
async function seedAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log("🤖 Aucun administrateur trouvé. Initialisation du compte...");
      
      const email = process.env.ADMIN_EMAIL || "admin@med-contest.com";
      const password = process.env.ADMIN_PASSWORD || "admin123";
      
      // Cryptage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      await Admin.create({
        name: "Administrateur Général", // Fixe définitivement le bug du champ requis !
        email: email,
        password: hashedPassword,
        role: "admin"
      });
      
      console.log(`🚀 [SEED] Compte admin créé automatiquement avec succès (${email}) !`);
    } else {
      console.log("ℹ️ [SEED] Un administrateur existe déjà dans la base de données.");
    }
  } catch (error) {
    console.error("❌ [SEED] Erreur lors de la création automatique de l'admin :", error);
  }
}

// 📌 Connexion MongoDB PUIS lancement du serveur (UNE SEULE FOIS)
mongoose
  .connect(MONGO_URI)
  .then(async () => { // 👈 Ajout de 'async' pour pouvoir utiliser 'await'
    console.log("✅ Connecté à MongoDB");

    // ⚡ Exécution du seed automatique dès que la base de données est prête
    await seedAdmin();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("❌ Erreur MongoDB :", err));