import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  texte?: string;
  enonce?: string; // 👈 AJOUT : Pour correspondre à la colonne "Enonce" de vos fichiers Excel
  image?: string | null;
  options?: string[];
  reponseCorrecte?: string;
  explication?: string; // 👈 AJOUT : Pour la colonne "Explication" Excel et les justifications de l'IA
  type?: string; // 👈 AJOUT : Pour différencier "qcm" et "faux-juste"
  subject: string;
  exam?: string;
  note?: number;
  isGroup: boolean;
  groupId?: mongoose.Types.ObjectId | null;
  isFree: boolean;
  typeEpreuve: string; 
  numeroConcoursBlanc?: string; 
}

const questionSchema = new Schema<IQuestion>(
  {
    texte: { type: String, default: null, trim: true },
    enonce: { type: String, default: null, trim: true }, // 👈 AJOUT
    image: { type: String, default: null },
    options: { type: [String], default: [] },
    reponseCorrecte: { type: String, default: null },
    explication: { type: String, default: null }, // 👈 AJOUT
    type: { type: String, default: "qcm" }, // 👈 AJOUT : "qcm" par défaut
    subject: { type: String, required: true },
    exam: { type: String, default: "Concours Blanc" }, 
    note: { type: Number, default: 1 },
    isGroup: { type: Boolean, default: false },
    groupId: { type: Schema.Types.ObjectId, ref: "QuestionGroup", default: null },
    isFree: { type: Boolean, default: false },
    typeEpreuve: { type: String, default: "officiel" }, 
    numeroConcoursBlanc: { type: String, default: null }, 
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);