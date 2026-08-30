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
      const rawType = String(row['TYPE'] || row['Type'] || row['type'] || '').trim();
      const isGroupType = rawType.toUpperCase() === 'GROUPE' || rawType.toUpperCase() === 'GROUP';
      
      const mainText = row['Texte de la question'] ? String(row['Texte de la question']).trim() : "";
      const subText = row['Sub_Question'] ? String(row['Sub_Question']).trim() : "";
      
      // Extraction des métadonnées
      const rawAnnee = row['Année'] || row['Annee'] || row['ANNEE'];
      const parsedAnnee = Number(rawAnnee);
      const rawSession = row['Session'] || row['session'] || "Normale";
      const formattedSession = rawSession.toString().toLowerCase().includes("rattrap") ? "Rattrapage" : "Normale";
      const rawMatiere = row['Matière'] || row['Matiere'] || row['matiere'] || "Non classée";
      const rawNumber = row["Numéro d'exercice"] || row["Numero d'exercice"] || row["Exercice"] || "Exercice";

      // ----------------------------------------------------
      // 1. CAS OÙ LA LIGNE EST UN GROUPE (Ex: Contexte / Partie)
      // ----------------------------------------------------
      if (isGroupType) {
        currentContext = mainText; // Mémorise le contexte pour les questions suivantes

        // 🎯 FIX : On utilise dynamiquement le nom de l'exercice ("EXERCICE 1", "EXERCICE 2"...)
        let groupLabel = " ";
        
        // S'il y a un nom de partie explicite court (ex: "Partie I"), on l'utilise à la place
        if (subText) {
          groupLabel = subText;
        } else if (mainText.includes(':') && mainText.indexOf(':') < 30) {
          groupLabel = mainText.split(':')[0].trim();
        }

        const groupData = {
          matiere: rawMatiere,
          annee: isNaN(parsedAnnee) ? 2024 : parsedAnnee,
          session: formattedSession,
          theme: row['Thème'] || row['Theme'] || "Non classé",
          numeroExercice: String(rawNumber).trim(),
          
          labelQuestion: groupLabel, // 👈 Affichera "EXERCICE 1" au lieu de "Contexte"
          Type: "GROUP",
          type: "GROUP",
          enonceTexte: mainText,
          
          imageUrl: row['Image'] || undefined,
          indices: {
            niveau1_piste: "",
            niveau2_formule: "",
            niveau3_corrige: ""
          },
          checklist: []
        };

        const savedGroup = await BacExam.create(groupData);
        importedQuestions.push(savedGroup);
        continue;
      }

      // ----------------------------------------------------
      // 2. CAS OÙ LA LIGNE EST UNE QUESTION CLASSIQUE
      // ----------------------------------------------------
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
        const aiResult = await generateSolutionAndHints(fullStatement);

        const questionLabelClean = `${currentTitle ? currentTitle : ""}${subQuestionMarker}`.trim() || "Question globale";

        const questionData = {
          matiere: rawMatiere,
          annee: isNaN(parsedAnnee) ? 2024 : parsedAnnee,
          session: formattedSession,
          theme: row['Thème'] || row['Theme'] || "Non classé",
          numeroExercice: String(rawNumber).trim(),
          labelQuestion: questionLabelClean,
          enonceTexte: questionLabel,
          Type: "QUESTION",
          type: "QUESTION",
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

    if (importedQuestions.length === 0) {
      res.status(400).json({ message: "Aucune question n'a pu être générée." });
      return;
    }

    res.status(200).json({ 
      success: true, 
      count: importedQuestions.length,
      message: `${importedQuestions.length} élément(s) importé(s) avec succès !`
    });

  } catch (error: any) {
    console.error("Erreur globale lors de l'importation Excel :", error);
    res.status(500).json({ message: error.message || "Erreur serveur lors du traitement du fichier." });
  }
});

export default router;