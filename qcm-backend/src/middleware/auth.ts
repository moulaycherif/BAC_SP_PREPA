import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Student from "../models/Student";

const SECRET = process.env.JWT_SECRET || "super_secret_key";

// Pour que TypeScript accepte req.student avec le rôle guest
declare global {
  namespace Express {
    interface Request {
      student?: any; 
    }
  }
}

export const authenticateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    // 🟢 NOUVEAU : Interception du token Invité
    if (token === "guest_token") {
      
      // 1. On crée un faux étudiant BLINDÉ pour ne faire planter aucun contrôleur
      req.student = { 
        _id: "000000000000000000000000", // Faux ID parfait pour MongoDB
        role: "guest",
        name: "Mode Démo",
        isActive: true, // Simule un compte actif
      };

      // 2. On intercepte TOUTES les requêtes de vérification de profil
      const url = req.originalUrl.toLowerCase();
      if (url.includes("/me") || url.includes("/profile") || url.includes("/verify") ) {
        return res.status(200).json(req.student);
      }

      // 3. On laisse passer la requête vers les contrôleurs
      return next();
    }

    // --- Suite normale pour les vrais étudiants ---
    const decoded: any = jwt.verify(token, SECRET);
    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(401).json({ error: "Étudiant non trouvé" });
    }

    // 🔥 ICI la clé
    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }
};