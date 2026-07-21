import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  // 🔒 Propriétés ajoutées pour la sécurité de session unique
  currentSessionId?: string | null;
  currentIp?: string | null;
  // 🚨 VOUS DEVEZ AVOIR CETTE LIGNE POUR QUE LES OPTIONS SOIENT SAUVEGARDÉES :
  options: { type: [String], default: [] },
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    // 🔒 Champs stockés en base de données pour valider le poste de connexion
    currentSessionId: { type: String, default: null },
    currentIp: { type: String, default: null },
    // 🚨 VOUS DEVEZ AVOIR CETTE LIGNE POUR QUE LES OPTIONS SOIENT SAUVEGARDÉES :
  options: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);