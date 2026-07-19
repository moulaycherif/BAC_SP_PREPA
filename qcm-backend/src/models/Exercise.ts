// models/Exercise.ts
import mongoose, { Document, Schema } from "mongoose";

// ======================================================
// 📘 Interfaces TypeScript
// ======================================================
export interface ISubQuestion {
  questionText: string;
  qType: 'qcm' | 'vrai_faux'; // Type de la sous-question
  options: string[];
  correctAnswer: string;
  explanation: string;
  image: string; // 🖼️ AJOUT ICI : Nom de l'image spécifique à la question
}

export interface IExercise extends Document {
  subject: string;
  chapter: string;
  contextText: string;
  contextImage: string;
  subQuestions: ISubQuestion[];
  difficulty: 'facile' | 'moyen' | 'difficile';
  isWhiteExam: boolean; 
  isFree: boolean; // Gestion des invités
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================
// 🗄️ Schémas Mongoose
// ======================================================

const subQuestionSchema = new Schema<ISubQuestion>({
  questionText: {
    type: String,
    required: [true, "Le texte de la question est requis"],
  },
  qType: {
    type: String,
    enum: ['qcm', 'vrai_faux'],
    default: 'qcm', // Par défaut, reste au format QCM
  },
  options: {
    type: [String],
    required: [true, "Les options de réponse sont requises"],
    validate: {
      validator: function (this: any, val: string[]) {
        // Si c'est un Vrai/Faux, on s'assure d'avoir 2 options
        if (this.qType === 'vrai_faux') {
          return val.length === 2;
        }
        const validOptions = val.filter(opt => opt && opt.trim() !== "");
        return validOptions.length >= 2;
      },
      message: "Nombre d'options de réponse invalides pour ce type de question.",
    },
  },
  correctAnswer: {
    type: String,
    required: [true, "La bonne réponse est requise"],
  },
  explanation: {
    type: String,
    default: "",
  },
  // 🖼️ AJOUT ICI : Champ image pour stocker les images insérées sur les lignes des questions
  image: {
    type: String,
    default: "",
  },
});

const exerciseSchema = new Schema<IExercise>(
  {
    subject: {
      type: String,
      required: [true, "La matière est requise"],
      trim: true,
    },
    chapter: {
      type: String,
      required: [true, "Le chapitre est requis"],
      trim: true,
    },
    contextText: {
      type: String,
      required: [true, "L'énoncé du problème (contexte) est requis"],
    },
    contextImage: {
      type: String,
      default: "",
    },
    subQuestions: {
      type: [subQuestionSchema],
      required: true,
      validate: {
        validator: function (val: ISubQuestion[]) {
          return val.length >= 1;
        },
        message: "Un exercice doit comporter au moins 1 sous-question.",
      },
    },
    difficulty: {
      type: String,
      enum: ['facile', 'moyen', 'difficile'],
      default: 'moyen',
    },
    isWhiteExam: {
      type: Boolean,
      default: false, // Par défaut, c'est un exercice normal
    },
    isFree: {
      type: Boolean,
      default: false, // Par défaut, l'exercice est payant / premium
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Exercise || mongoose.model<IExercise>("Exercise", exerciseSchema);