import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  // 🔒 Propriétés ajoutées pour la sécurité de session unique
  currentSessionId?: string | null;
  currentIp?: string | null;
}

const AdminSchema = new Schema<IAdmin>({
  // ✅ AJOUT DE LA VALEUR PAR DÉFAUT : Si quelqu'un crée un admin sans nom, Mongoose mettra "Administrateur" au lieu de faire crasher le serveur (Erreur 500)
  name: { type: String, required: true, default: "Administrateur" },
  
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // 🔒 Champs stockés en base de données pour valider la session
  currentSessionId: { type: String, default: null },
  currentIp: { type: String, default: null },
});

export default mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);