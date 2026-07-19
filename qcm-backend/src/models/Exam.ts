import mongoose, { Document, Schema } from "mongoose";

export interface IExam extends Document {
  title: string;      
  subject: string;    
  date?: Date;
  isFree: boolean; // 👈 AJOUT ICI
}

const ExamSchema = new Schema<IExam>({
  title: { type: String, required: true, unique: true, trim: true },
  subject: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isFree: { type: Boolean, default: false }, // 👈 AJOUT ICI
});

export default mongoose.models.Exam || mongoose.model<IExam>("Exam", ExamSchema);