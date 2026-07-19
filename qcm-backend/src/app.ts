import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Importations des routes
import authRoutes from "./routes/authRoutes";
import questionRoutes from "./routes/questionRoutes";
import adminRoutes from "./routes/adminRoutes";
import exerciseRoutes from "./routes/exerciseRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import studentRoutes from "./routes/studentRoutes";
import rankingRoutes from "./routes/rankingRoutes";
import statsRoutes from "./routes/statsRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import astuceRoutes from "./routes/astuceRoutes";

dotenv.config();

const app = express();

// 📁 Création des dossiers de stockage si inexistants
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

if (!fs.existsSync("uploads/resumes")) {
  fs.mkdirSync("uploads/resumes", { recursive: true });
}

// 🔒 ✅ CONFIGURATION CORS UNIQUE ET STRICTE
const allowedOrigins = [
  "http://localhost:5173",          // Frontend local (Vite)
  "https://med-contest.vercel.app"  // Frontend de production (Vercel)
];

app.use(cors({
  origin: (origin, callback) => {
    // Permet aux requêtes sans origine (comme Postman ou les requêtes internes) de passer
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Bloqué par la politique CORS de Med-Contest"));
    }
  },
  credentials: true, // 🔥 Requis pour le bon fonctionnement de withCredentials: true côté frontend
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Gestion des requêtes de pré-vérification (Preflight)
app.options("*", cors());

// Middlewares de parsing pour les données reçues
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🚀 ✅ ROUTES PRINCIPALES
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/stats", statsRoutes); // Déclaré une seule fois ici
app.use("/api/upload", uploadRoutes);
app.use("/api/astuces", astuceRoutes);

// Fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/uploads/resumes", express.static(path.join(__dirname, "uploads/resumes")));

// 🔹 Route test d'accueil
app.get("/", (req, res) => {
  res.send("✅ API MED-CONTEST backend en ligne ! Utilisez /api/questions ou /api/auth pour interagir.");
});

export default app;