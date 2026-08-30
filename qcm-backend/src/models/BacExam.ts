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
  numeroExercice: string; 
  labelQuestion: string;  
  enonceTexte: string;
  imageUrl?: string;
  Type?: string;          
  type?: string;          
  indices: IScaffolding;
  checklist: ICritereCorrection[];
  createdAt: Date;
}

console.log("bacExam (models)")

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
  numeroExercice: {       
    type: String, 
    required: true 
  },
  labelQuestion: {        
    type: String, 
    required: true 
  },  
  Type: {                 
    type: String, 
    required: false 
  },
  type: {                 
    type: String, 
    required: false 
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
    niveau1_piste: { type: String, required: false },
    niveau2_formule: { type: String, required: false },
    niveau3_corrige: { type: String, required: false }
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