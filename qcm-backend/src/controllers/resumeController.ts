// controllers/resumeController.ts
import { Response } from "express";
import Resume from "../models/resume";
import { supabase } from "../config/supabase";
import StudentActivity from "../models/StudentActivity";
// 🚨 NOUVEAU : Import du type personnalisé
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// 📌 Récupérer les résumés par matière
export const getResumesBySubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject } = req.params;
    const resumes = await Resume.find({ subject }).sort({ createdAt: -1 });

    const formatted = resumes.map((r) => ({
      id: r._id,
      subject: r.subject,
      chapter: r.chapter,
      url: r.pdfUrl,
      created_at: r.createdAt,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("❌ Erreur getResumesBySubject :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Générer une URL signée Supabase
export const getSignedResumeUrl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Résumé introuvable" });

    // Garde-fou pour l'invité
    if (req.student?.role === "guest") {
      return res.status(403).json({ message: "🔒 Action interdite en mode Démo." });
    }

    const bucket = process.env.SUPABASE_BUCKET!;
    let storagePath = (resume as any).storagePath;

    if (!storagePath && resume.pdfUrl) {
      const parts = resume.pdfUrl.split(`/object/public/${bucket}/`);
      if (parts.length !== 2) {
        return res.status(400).json({ message: "URL PDF invalide" });
      }
      storagePath = parts[1];
      (resume as any).storagePath = storagePath;
      await resume.save();
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 600);

    if (error) {
      console.error("❌ Supabase:", error);
      return res.status(500).json({ message: "Erreur Supabase" });
    }

    // 📊 Tracker activité étudiant (sécurisé par le type AuthenticatedRequest)
    if (req.student && req.student.role !== "guest") {
      await StudentActivity.create({
        studentId: req.student._id.toString(),   
        type: "RESUME",
        subject: resume.subject,
        chapter: resume.chapter,
        referenceId: resume._id.toString(),
      });
    }

    res.json({ signedUrl: data.signedUrl });
  } catch (e) {
    console.error("❌ getSignedResumeUrl:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};