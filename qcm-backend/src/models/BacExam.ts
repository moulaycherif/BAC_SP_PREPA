import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Typage TypeScript pour la Checklist de correction
export interface ICritereCorrection {
  description: string; // ex: "Avoir appliqué la deuxième loi de Newton"
  points: number;      // ex: 0.5
}

// 2️⃣ Typage TypeScript pour le système d'aide (Scaffolding)
export interface IScaffolding {
  niveau1_piste: string;   // Indice conceptuel (Piste réflexive)
  niveau2_formule: string; // Indice calculatoire ou loi à utiliser
  niveau3_corrige: string; // Rédaction partielle et rigoureuse
}

// 3️⃣ Typage global du document
export interface IBacExam extends Document {
  annee: number;
  session: "Normale" | "Rattrapage";
  theme: string;           // ex: "Mécanique", "Ondes", "Suivi temporel"
  titreExercice: string;   // ex: "Chute libre d'un projectile"
  enonceTexte: string;     // L'énoncé complet de l'exercice (supporte le Markdown/LaTeX)
  imageUrl?: string;       // Image éventuelle accompagnant le sujet (circuit, graphe)
  indices: IScaffolding;   // Les 3 niveaux d'aide
  checklist: ICritereCorrection[]; // Le barème officiel découpé
  createdAt: Date;
}

// ⚙️ Définition du Schéma Mongoose
const BacExamSchema: Schema = new Schema({
  annee: { 
    type: Number, 
    required: true 
  },
  session: { 
    type: String, 
    required: true,
    enum: ["Normale", "Rattrapage"] 
  },
  theme: { 
    type: String, 
    required: true,
    index: true // Indexé pour accélérer le filtrage par thème
  },
  titreExercice: { 
    type: String, 
    required: true 
  },
  enonceTexte: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String,
    required: false 
  },
  
  // Implémentation du Scaffolding (Boutons d'aide)
  indices: {
    niveau1_piste: { type: String, required: true },
    niveau2_formule: { type: String, required: true },
    niveau3_corrige: { type: String, required: true }
  },

  // Implémentation de la Grille de critères (Auto-évaluation)
  checklist: [
    {
      description: { type: String, required: true },
      points: { type: Number, required: true }
    }
  ],

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Exportation du modèle
export default mongoose.model<IBacExam>("BacExam", BacExamSchema);