import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionGroup extends Document {
  image?: string | null;
  intro?: string | null;
  subject: string;
  exam: string;
  order?: number;
  isFree: boolean; // 👈 AJOUT ICI
}

const questionGroupSchema = new Schema<IQuestionGroup>(
  {
    image: { type: String, default: null },
    intro: { type: String, default: null },
    subject: { type: String, required: true },
    exam: { type: String, required: true },
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false }, // 👈 AJOUT ICI
  },
  { timestamps: true }
);

export default mongoose.models.QuestionGroup || mongoose.model<IQuestionGroup>("QuestionGroup", questionGroupSchema);