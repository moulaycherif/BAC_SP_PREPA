// routes/uploadRoutes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
// 🚨 NOUVEAU : Sécurisation de l'upload
import { authenticateStudent, blockGuest } from "../middleware/authMiddleware";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 🔒 Interdit aux invités, réservé aux créateurs de contenu authentifiés
router.post("/image", authenticateStudent, blockGuest, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucune image" });
  }

  res.json({
    url: `http://localhost:5000/uploads/${req.file.filename}`,
  });
});

export default router;