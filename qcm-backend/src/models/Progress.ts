import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: string;
  qcmId: string;
  currentQuestion: number;
  totalQuestions: number;
  progressPercent: number;
}

const ProgressSchema = new Schema<IProgress>({
  userId: { type: String, required: true },
  qcmId: { type: String, required: true },
  currentQuestion: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  progressPercent: { type: Number, default: 0 },
});

export default mongoose.model<IProgress>("Progress", ProgressSchema);
