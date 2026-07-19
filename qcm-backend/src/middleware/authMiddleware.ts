// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Student, { IStudent } from "../models/Student";

const SECRET = process.env.JWT_SECRET || "votre_secret_jwt_super_securise";

// 🔄 On ajoute "isGuest" dans le type du Payload du Token
export interface AuthPayload {
  userId: string;
  sessionId: string;
  isAdmin: boolean;
  isGuest?: boolean; // 👈 NOUVEAU
}

export interface AuthenticatedRequest extends Request {
  student?: any; 
  auth?: AuthPayload;
}

export const authenticateStudent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    // 1. Décoder et vérifier le token JWT (valable pour Étudiants ET Invités)
    const decoded = jwt.verify(token, SECRET) as AuthPayload;
    req.auth = decoded; 

    // 🟢 2. INTERCEPTION DU MODE INVITÉ (Via le JWT décodé)
    if (decoded.isGuest) {
      req.student = { 
        _id: "000000000000000000000000", // Faux ID pour éviter les crashs
        role: "guest",
        name: "Mode Démo",
        email: "demo@med-contest.com",
        isActive: true,
      };

      // Autoriser immédiatement les requêtes de vérification de profil initiales
      const url = req.originalUrl.toLowerCase();
      if (url.includes("/me") || url.includes("/profile") || url.includes("/verify")) {
        return res.status(200).json(req.student);
      }

      return next(); // On passe à la route demandée
    }

    // --- COMPORTEMENT NORMAL POUR LES VRAIS ÉTUDIANTS ---
    
    // 3. Chercher l'étudiant en base de données
    const student = await Student.findById(decoded.userId);
    if (!student) {
      return res.status(401).json({ error: "Étudiant non trouvé" });
    }

    // 🛑 4. SÉCURITÉ POSTE UNIQUE : Comparaison des sessions
    if (student.currentSessionId !== decoded.sessionId) {
      return res.status(403).json({ 
        code: "SESSION_KICKED", 
        error: "Votre compte est connecté sur un autre poste informatique." 
      });
    }

    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide" });
  }
};

/**
 * 🛡️ MIDDELWARE DE BLOCAGE TOTAL POUR LES INVITÉS
 * À placer sur les routes interdites aux invités (ex: statistiques, examens payants...)
 */
export const blockGuest = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.student && req.student.role === "guest") {
    return res.status(403).json({
      code: "GUEST_RESTRICTED",
      error: "🔒 Cette fonctionnalité n'est pas disponible en mode Démo. Veuillez vous abonner pour y accéder."
    });
  }
  next();
};