import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  texte?: string;
  enonce?: string;
  image?: string | null;
  options?: string[];
  reponseCorrecte?: string;
  explication?: string;
  type?: string; 
  subject: string;
  chapter?: string;
  exam?: string;
  note?: number;
  isGroup: boolean;
  groupId?: mongoose.Types.ObjectId | null;
  isFree: boolean;
  typeEpreuve: string; 
  numeroConcoursBlanc?: string; 
}

console.log("Question (models)")

const questionSchema = new Schema<IQuestion>(
  {
    texte: { type: String, default: null, trim: true },
    enonce: { type: String, default: null, trim: true },
    image: { type: String, default: null },
    options: { type: [String], default: [] },
    reponseCorrecte: { type: String, default: null },
    explication: { type: String, default: null },
    type: { type: String, default: "qcm" }, // Accepte désormais 'exercise', 'astuce', 'flashcard'
    subject: { type: String, required: true },
    chapter: { type: String, default: null },
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