import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

export const verifyAdmin = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (req.admin) {
    next();
  } else {
    res.status(403).json({ error: "Accès réservé à l'admin" });
  }
};
