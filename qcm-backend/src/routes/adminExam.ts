import express, { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import BacExam from '../models/BacExam';
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

    if (rows.length === 0) {
      res.status(400).json({ message: "Le fichier Excel est vide." });
      return;
    }

    const importedQuestions = [];
    let currentContext = ""; 
    let currentTitle = ""; 

    for (const row of rows) {
      const type = row['TYPE'] || row['Type'] || row['type'];
      const mainText = row['Texte de la question'] ? String(row['Texte de la question']).trim() : "";
      const subText = row['Sub_Question'] ? String(row['Sub_Question']).trim() : "";
      
      // 1. Gestion du contexte
      if (type === 'Groupe') {
        currentContext = mainText; 
        continue; 
      }

      // 2. Gestion des questions
      if (type === 'Question') {
        if (!mainText && !subText) continue;

        if (mainText) {
          currentTitle = mainText;
        }

        let questionLabel = "";
        let subQuestionMarker = "";

        if (subText) {
          const match = subText.match(/^([a-zA-Z0-9]+[)\.-])/);
          if (match) {
            subQuestionMarker = ` ${match[1]}`;
          }
          questionLabel = `${currentTitle} ${subText}`;
        } else {
          questionLabel = currentTitle;
        }

        const fullStatement = `**Contexte :**\n${currentContext}\n\n**Question :**\n${questionLabel}`;

        try {
          // Appel à l'IA
          const aiResult = await generateSolutionAndHints(fullStatement);

          // 🛡️ Extraction sécurisée des colonnes (supporte avec ou sans accent)
          const rawAnnee = row['Année'] || row['Annee'] || row['ANNEE'];
          const parsedAnnee = Number(rawAnnee);

          const rawSession = row['Session'] || row['session'] || "Normale";
          const formattedSession = rawSession.toString().toLowerCase().includes("rattrap") ? "Rattrapage" : "Normale";

          const rawNumber = row["Numéro d'exercice"] || row["Numero d'exercice"] || row["Exercice"] || "Exercice";

          const questionData = {
            annee: isNaN(parsedAnnee) ? 2024 : parsedAnnee,
            session: formattedSession,
            theme: row['Thème'] || row['Theme'] || "Non classé",
            titreExercice: `${rawNumber}${currentTitle ? ` - ${currentTitle}` : ""}${subQuestionMarker}`,
            enonceTexte: fullStatement, 
            imageUrl: row['Image'] || undefined,
            indices: {
              niveau1_piste: aiResult.indices.niveau1_piste,
              niveau2_formule: aiResult.indices.niveau2_formule,
              niveau3_corrige: aiResult.indices.niveau3_corrige
            },
            checklist: aiResult.checklist
          };

          const savedQuestion = await BacExam.create(questionData);
          importedQuestions.push(savedQuestion);
        } catch (aiError: any) {
          console.error(`❌ Erreur sur la question : "${questionLabel}"`, aiError?.message || aiError);
        }
      }
    }

    if (importedQuestions.length === 0) {
      res.status(400).json({ message: "Aucune question n'a pu être générée. Vérifiez vos clés d'API IA et les entêtes Excel." });
      return;
    }

    res.status(200).json({ 
      success: true, 
      count: importedQuestions.length,
      message: `${importedQuestions.length} question(s) importée(s) et générée(s) avec succès !`
    });

  } catch (error: any) {
    console.error("Erreur globale lors de l'importation Excel :", error);
    res.status(500).json({ message: error.message || "Erreur serveur lors du traitement du fichier." });
  }
});

export default router;