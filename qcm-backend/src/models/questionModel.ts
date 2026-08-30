import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  texte?: string;
  image?: string | null;
  options?: string[];
  reponseCorrecte?: string;
  subject: string;
  exam: string;
  note?: number;
  isGroup: boolean;
  groupId?: mongoose.Types.ObjectId | null;
  isFree: boolean; // 👈 AJOUT ICI
}

const questionSchema = new Schema<IQuestion>(
  {
    texte: { type: String, default: null, trim: true },
    image: { type: String, default: null },
    options: { type: [String], default: [] },
    reponseCorrecte: { type: String, default: null },
    subject: { type: String, required: true },
    exam: { type: String, required: true },
    note: { type: Number, default: 1 },
    isGroup: { type: Boolean, default: false },
    groupId: { type: Schema.Types.ObjectId, ref: "QuestionGroup", default: null },
    isFree: { type: Boolean, default: false }, // 👈 AJOUT ICI
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model<IQuestion>("Question", questionSchema);