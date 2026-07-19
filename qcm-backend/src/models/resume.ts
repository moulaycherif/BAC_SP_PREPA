import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    chapter: { type: String, required: true },
    pdfUrl: { type: String, required: true },      
    storagePath: { type: String, required: true }, 
    isFree: { type: Boolean, default: false }, // 👈 AJOUT ICI
  },
  { timestamps: true }
);

export default mongoose.model("Resume", ResumeSchema);