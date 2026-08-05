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

    const importedQuestions = [];
    let currentContext = ""; 
    let currentTitle = ""; 

    for (const row of rows) {
      const type = row['TYPE'];
      
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
        let subQuestionMarker = ""; // 👈 Nouvelle variable pour stocker "a)", "b)", etc.

        // 🧠 Traitement et extraction
        if (subText) {
          // Cette Regex capture intelligemment les marqueurs comme "a)", "b.", "1)", "II." au début du texte
          const match = subText.match(/^([a-zA-Z0-9]+[)\.-])/);
          if (match) {
            subQuestionMarker = ` ${match[1]}`; // Ex: " a)" ou " b)"
          }

          questionLabel = `${currentTitle} ${subText}`;
        } else {
          questionLabel = currentTitle;
        }

        const fullStatement = `**Contexte :**\n${currentContext}\n\n**Question :**\n${questionLabel}`;

        try {
          // Appel à l'IA
          const aiResult = await generateSolutionAndHints(fullStatement);

          const questionData = {
              annee: Number(row['Année']),
              session: row['Session'] as "Normale" | "Rattrapage",
              theme: row['Thème'] || "Non classé",
              // 🎯 AJOUT ICI : On fusionne le numéro d'exercice, le titre principal, ET le marqueur de sous-question
              titreExercice: row["Numéro d'exercice"] + (currentTitle ? ` - ${currentTitle}` : "") + subQuestionMarker,
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
        } catch (aiError) {
          console.error(`Erreur IA lors du traitement de la question : ${questionLabel}`, aiError);
        }
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