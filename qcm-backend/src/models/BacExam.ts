import mongoose, { Schema, Document } from "mongoose";

export interface ICritereCorrection {
  description: string;
  points: number;
}

export interface IScaffolding {
  niveau1_piste: string;
  niveau2_formule: string;
  niveau3_corrige: string;
}

export interface IBacExam extends Document {
  matiere: string;
  annee: number;
  session: "Normale" | "Rattrapage";
  theme: string;
  numeroExercice: string; // 👈 Remplacement ici
  labelQuestion: string;  // 👈 Remplacement ici
  enonceTexte: string;
  imageUrl?: string;
  indices: IScaffolding;
  checklist: ICritereCorrection[];
  createdAt: Date;
}

const BacExamSchema: Schema = new Schema({
  matiere: { 
    type: String, 
    required: true,
    index: true 
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
  numeroExercice: {       // 👈 Nouveau champ
    type: String, 
    required: true 
  },
  labelQuestion: {        // 👈 Nouveau champ
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