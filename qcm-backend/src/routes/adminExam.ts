import express, { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import BacExam from '../models/BacExam'; // 👈 L'importation est corrigée ici
import { generateSolutionAndHints } from '../services/aiService';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-excel', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Aucun fichier fourni." });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    const importedQuestions = [];
    let currentContext = ""; 
    let currentTitle = ""; 

    for (const row of rows) {
      const type = row['TYPE'];
      
      // 1. Gestion du contexte (l'énoncé global de l'exercice)
      if (type === 'Groupe') {
        currentContext = row['Texte de la question'] || ""; 
        continue; 
      }

      // 2. Gestion des questions (sous-questions de l'exercice)
      if (type === 'Question') {
        const mainText = row['Texte de la question'] || "";
        const subText = row['Sub_Question'] || "";

        if (mainText && !subText) {
             currentTitle = mainText; 
             continue; 
        } else if (mainText && subText) {
             currentTitle = mainText;
        }

        // Création de l'énoncé complet à envoyer à l'IA et à afficher à l'étudiant
        const fullStatement = `**Contexte :**\n${currentContext}\n\n**Question :**\n${currentTitle} ${subText}`;

        // 🧠 Appel à l'IA (OpenRouter) pour générer le scaffolding et la checklist
        const aiResult = await generateSolutionAndHints(fullStatement);

        // 🛠️ Mapping avec votre modèle BacExam.ts
        const questionData = {
            annee: Number(row['Année']),
            session: row['Session'] as "Normale" | "Rattrapage",
            theme: row['Thème'] || "Non classé",
            titreExercice: row["Numéro d'exercice"] + (currentTitle ? ` - ${currentTitle}` : ""),
            enonceTexte: fullStatement, 
            imageUrl: row['Image'] || undefined,
            indices: {
                niveau1_piste: aiResult.indices.niveau1_piste,
                niveau2_formule: aiResult.indices.niveau2_formule,
                niveau3_corrige: aiResult.indices.niveau3_corrige
            },
            checklist: aiResult.checklist
        };

        // Sauvegarde dans la collection BacExam
        const savedQuestion = await BacExam.create(questionData);
        importedQuestions.push(savedQuestion);
      }
    }

    res.status(200).json({ 
      success: true, 
      count: importedQuestions.length,
      message: `${importedQuestions.length} questions importées avec succès !`
    });

  } catch (error) {
    console.error("Erreur lors de l'importation Excel :", error);
    res.status(500).json({ message: "Erreur lors du traitement du fichier." });
  }
});

export default router;