import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  currentSessionId?: string | null;
  currentIp?: string | null;
  // ✅ CORRECTION TypeScript : options est simplement un tableau de chaînes de caractères
  options: string[]; 
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    currentSessionId: { type: String, default: null },
    currentIp: { type: String, default: null },
    // ✅ CORRECTION Mongoose : La bonne syntaxe pour un tableau de Strings
    options: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);