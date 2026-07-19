import mongoose from "mongoose";
import dotenv from "dotenv";
import Astuce from "../models/Astuce";

dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qcmdb";

async function seedAstuces() {
  try {
    console.log("🌍 Connexion à MongoDB…");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connecté.");

    const astuces = [
      {
        chapitre: "Chapitre I : Suites & Sommes",
        question: "Comment reconnaître une suite arithmétique ?",
        answer: "On vérifie que u(n+1) - u(n) est constant.",
      },
      {
        chapitre: "Chapitre I : Suites & Sommes",
        question: "Astuce pour calculer une somme de termes consécutifs ?",
        answer: "Utiliser la formule de Gauss : (n(n+1))/2.",
      },
      {
        chapitre: "Chapitre II : Limites, Continuité & Dérivabilité",
        question: "Astuce limite indéterminée 0/0",
        answer: "Toujours factoriser ou utiliser des identités remarquables.",
      },
      {
        chapitre: "Chapitre IV : Nombres complexes",
        question: "Astuce pour trouver le module d’un complexe",
        answer: "|z| = √(x² + y²).",
      }
    ];

    await Astuce.deleteMany({});
    console.log("🗑 Anciennes astuces supprimées.");

    await Astuce.insertMany(astuces);
    console.log("✅ Nouvelles astuces ajoutées !");

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Erreur seed :", err);
    mongoose.disconnect();
  }
}

seedAstuces();
