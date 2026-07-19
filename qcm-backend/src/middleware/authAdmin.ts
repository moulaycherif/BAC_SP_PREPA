import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

export interface AuthAdminRequest extends Request {
  admin?: any;
}

export const authenticateAdmin = async (
  req: AuthAdminRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // 💡 Note : On utilise decoded.userId car c'est la clé injectée lors du loginAdmin
    const admin = await Admin.findById(decoded.userId);
    if (!admin) return res.status(401).json({ error: "Admin non trouvé" });

    // 🛑 SÉCURITÉ POSTE UNIQUE ADMIN
    // Si la session du token ne correspond plus à celle enregistrée en BDD : expulsion !

    if (admin.currentSessionId !== decoded.sessionId) {
      return res.status(403).json({ 
        code: "SESSION_KICKED", 
        error: "Votre compte Administrateur s'est connecté sur un autre appareil." 
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("❌ Erreur vérification token admin :", err);
    return res.status(401).json({ error: "Token invalide" });
  }
};