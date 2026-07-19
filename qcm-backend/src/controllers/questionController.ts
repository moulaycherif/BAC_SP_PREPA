import { Request, Response } from "express";
import Question from "../models/Question";
import Exam from "../models/Exam";
import QuestionGroup from "../models/QuestionGroup";
import XLSX from "xlsx";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

const normalize = (s: string) =>
  s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

const getCell = (row: any, key: string) => {
  const expected = normalize(key);
  const found = Object.entries(row).find(
    ([k]) => normalize(k) === expected
  );
  return found ? found[1] : "";
};

/* ============================================================
    📥 GET QUESTIONS
============================================================ */
export const getQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 👈 NOUVEAU : Ajout de numeroConcoursBlanc et typeEpreuve dans les paramètres attendus
    const { exam, subject, numeroConcoursBlanc, typeEpreuve } = req.query as any;
    const isGuest = req.student?.role === "guest";
    const filter: any = {};
    
    if (exam) filter.exam = { $regex: new RegExp(`^${exam.trim()}$`, "i") };
    if (subject) filter.subject = { $regex: new RegExp(`^${subject.trim()}$`, "i") };
    
    // 👈 NOUVEAU : Application des filtres pour concours blancs
    if (typeEpreuve) filter.typeEpreuve = typeEpreuve;
    if (numeroConcoursBlanc) filter.numeroConcoursBlanc = numeroConcoursBlanc;

    let query = Question.find(filter)
      .populate({
        path: "groupId",
        model: "QuestionGroup",
        select: "image intro subject exam order",
      })
      .sort({ "groupId.order": 1, _id: 1 })
      .lean();

    if (isGuest) {
      query = query.limit(1) as any;
    }

    const questions = await query;
    res.json(questions);
  } catch (err) {
    console.error("❌ getQuestions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/* ============================================================
    📥 IMPORT EXCEL — GROUPES + QUESTIONS
============================================================ */
export const importExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier Excel manquant" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: "" });

    //await Question.deleteMany({});
    //await QuestionGroup.deleteMany({});

    let lastSubject = "";
    let lastExam = "";
    let lastNumeroBlanc = ""; // 👈 NOUVEAU : Mémoriser le numéro de concours blanc

    let currentGroup: any = null;
    let groupOrder = 0;
    let questionOrder = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const type = String(getCell(row, "Type")).trim().toUpperCase();
      const texte = String(getCell(row, "Texte de la question")).trim();
      const imageCell = String(getCell(row, "Image")).trim();
      const subjectCell = String(getCell(row, "Matière")).trim();
      const examCell = String(getCell(row, "Concours / Examen")).trim();
      const numeroBlancCell = String(getCell(row, "Numéro de concours")).trim(); // 👈 NOUVEAU : Colonne Excel attendue

      if (subjectCell) lastSubject = subjectCell;
      if (examCell) lastExam = examCell;
      if (numeroBlancCell) lastNumeroBlanc = numeroBlancCell; // 👈 NOUVEAU

      // 🔒 Sécurité ajustée : on exige soit un examen, soit un numéro de concours
      if (!lastSubject || (!lastExam && !lastNumeroBlanc)) {
        console.warn(`⛔ Ligne ${i + 2} ignorée (matière, ou examen/numéro manquant)`);
        continue;
      }

      // 👈 NOUVEAU : Déduction du type d'épreuve
      const typeEpreuve = lastNumeroBlanc ? "blanc" : "officiel";

      const options = [
        getCell(row, "Option 1"), getCell(row, "Option 2"), getCell(row, "Option 3"),
        getCell(row, "Option 4"), getCell(row, "Option 5"),
      ].map(o => String(o).trim()).filter(Boolean);

      const reponseCorrecte = String(getCell(row, "Réponse correcte")).trim();
      const note = Number(getCell(row, "Note") || 1);

      /* 🟦 CAS 1 — GROUPE */
      if (type === "GROUP") {
        groupOrder++;
        let cleanIntro = texte;
        if (cleanIntro.includes("\\begin{figure}")) {
          cleanIntro = cleanIntro.split("\\begin{figure}")[0].trim();
        }

        currentGroup = await QuestionGroup.create({
          image: imageCell ? `/uploads/questions/${imageCell}.png` : null,
          intro: cleanIntro,
          subject: lastSubject,
          exam: lastExam || "Concours Blanc",
          order: groupOrder,
          // (Si votre modèle QuestionGroup a ces champs, ajoutez-les. Sinon ce n'est pas bloquant)
        });
        continue;
      }

      /* 🟩 CAS 2 — QUESTION SIMPLE */
      if (type === "SIMPLE") {
        await Question.create({
          texte,
          image: imageCell ? `/uploads/questions/${imageCell}.png` : null, 
          options,
          reponseCorrecte,
          subject: lastSubject,
          exam: lastExam || "Concours Blanc",
          note,
          groupId: null,
          order: ++questionOrder,
          typeEpreuve,               // 👈 NOUVEAU
          numeroConcoursBlanc: lastNumeroBlanc // 👈 NOUVEAU
        });
        continue;
      }

      /* 🟨 CAS 3 — QUESTION DE GROUPE */
      if (type === "QUESTION") {
        if (!currentGroup) throw new Error(`QUESTION sans GROUP ligne ${i + 2}`);
        await Question.create({
          texte,
          image: imageCell ? `/uploads/questions/${imageCell}.png` : null, 
          options,
          reponseCorrecte,
          subject: lastSubject,
          exam: lastExam || "Concours Blanc",
          note,
          groupId: currentGroup._id,
          order: ++questionOrder,
          typeEpreuve,               // 👈 NOUVEAU
          numeroConcoursBlanc: lastNumeroBlanc // 👈 NOUVEAU
        });
        continue;
      }
    }

    res.json({ message: "✅ Import Excel terminé avec succès" });
  } catch (error: any) {
    console.error("❌ Import Excel error:", error);
    res.status(500).json({ message: "Erreur lors de l'import Excel", error: error.message });
  }
};

/* ============================================================
    📚 AUTRES ROUTES
============================================================ */

export const getExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let exams = await Question.distinct("exam", { typeEpreuve: "officiel" }); // 👈 MODIFIÉ : exclure les blancs de la liste classique
    exams = exams.sort();
    res.json(exams.map((title) => ({ _id: title, title })));
  } catch (err) {
    res.status(500).json({ error: "Erreur examens" });
  }
};

// 🌟 FONCTION CORRIGÉE : Récupérer la liste des concours blancs au bon format
export const getConcoursBlancs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let blancs = await Question.distinct("numeroConcoursBlanc", { typeEpreuve: "blanc" });
    
    // Trier les numéros correctement (ex: 1, 2, 3...)
    blancs = blancs.filter(Boolean).sort((a: any, b: any) => Number(a) - Number(b));
    
    // 👈 NOUVEAU : On transforme les simples numéros en objets avec _id et title
    // C'est ce qui règle définitivement le problème "Examen sans titre" sur le frontend !
    const formattedBlancs = blancs.map((num) => ({
      _id: String(num), // L'identifiant (ex: "1")
      title: `Concours Blanc ${num}` // Le joli titre affiché (ex: "Concours Blanc 1")
    }));

    res.json(formattedBlancs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur concours blancs" });
  }
};

export const getSubjectsByExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let subjects = await Question.distinct("subject", { exam: req.params.exam });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: "Erreur matières" });
  }
};

export const deleteAllQuestions = async (_req: AuthenticatedRequest, res: Response) => {
  await Question.deleteMany({});
  await QuestionGroup.deleteMany({});
  res.json({ message: "✅ Toutes les questions supprimées" });
};

export const importQuestions = importExcel;