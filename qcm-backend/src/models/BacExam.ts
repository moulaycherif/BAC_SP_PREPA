import mongoose, { Schema, Document } from "mongoose";

// 1️⃣ Typage TypeScript pour la Checklist de correction
export interface ICritereCorrection {
  description: string;
  points: number;
}

// 2️⃣ Typage TypeScript pour le système d'aide (Scaffolding)
export interface IScaffolding {
  niveau1_piste: string;
  niveau2_formule: string;
  niveau3_corrige: string;
}

// 3️⃣ Typage global du document
export interface IBacExam extends Document {
  matiere: string;         // 👈 NOUVEAU : On ajoute la matière !
  annee: number;
  session: "Normale" | "Rattrapage";
  theme: string;
  titreExercice: string;
  enonceTexte: string;
  imageUrl?: string;
  indices: IScaffolding;
  checklist: ICritereCorrection[];
  createdAt: Date;
}

// ⚙️ Définition du Schéma Mongoose
const BacExamSchema: Schema = new Schema({
  matiere: {               // 👈 NOUVEAU : On l'ajoute au schéma Mongoose
    type: String, 
    required: true,
    index: true            // Indexé car on va beaucoup filtrer par matière
  },
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
    index: true 
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
  indices: {
    niveau1_piste: { type: String, required: true },
    niveau2_formule: { type: String, required: true },
    niveau3_corrige: { type: String, required: true }
  },
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

export default mongoose.model<IBacExam>("BacExam", BacExamSchema);