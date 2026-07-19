import mongoose from "mongoose";

const StudentActivitySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "RESUME",
        "ASTUCE",
        "QCM",
        "EXERCISE",
      ],
    },

    subject: String,

    chapter: String,

    referenceId: String,

    // 📊 Résultats
    score: Number,

    totalQuestions: Number,

    successRate: Number,

    duration: Number,

    examId: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "StudentActivity",
  StudentActivitySchema
);