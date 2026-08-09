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
      // 1. CAS OÙ LA LIGNE EST UN GROUPE (Ex: Partie I, Partie II)
      // ----------------------------------------------------
      if (isGroupType) {
        currentContext = mainText; // Mémorise le contexte pour les questions suivantes

        const groupData = {
          matiere: rawMatiere,
          annee: isNaN(parsedAnnee) ? 2024 : parsedAnnee,
          session: formattedSession,
          theme: row['Thème'] || row['Theme'] || "Non classé",
          numeroExercice: String(rawNumber).trim(),
          labelQuestion: subText || mainText.split(':')[0] || "Partie",
          Type: "GROUP", // 👈 Transmis explicitement à MongoDB !
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
        continue; // Passe à la ligne suivante sans appeler l'IA
      }

      // ----------------------------------------------------
      // 2. CAS OÙ LA LIGNE EST UNE QUESTION CLASSIQUE
      // ----------------------------------------------------
      if (!mainText && !subText) continue;

      if (mainText) {
        currentTitle = mainText; // Mémorise le paragraphe/titre courant
      }

      // --- A. GESTION DES LABELS COURTS (Ex: "1) a)") ---
      let parentMarker = "";
      const parentMatch = currentTitle.match(/^([a-zA-Z0-9]+[)\.-])/);
      if (parentMatch) parentMarker = parentMatch[1]; // Récupère le "1)"

      let currentMarker = "";
      let dbLabelQuestion = "Question";

      if (subText) {
        const childMatch = subText.match(/^([a-zA-Z0-9]+[)\.-])/);
        if (childMatch) currentMarker = childMatch[1]; // Récupère le "a)"
        // Combine pour faire "1) a)"
        dbLabelQuestion = (parentMarker && currentMarker) ? `${parentMarker} ${currentMarker}` : (currentMarker || parentMarker || "Question");
      } else {
        dbLabelQuestion = parentMarker || "Question";
      }

      // --- B. TEXTE POUR MONGODB (Sans les doublons) ---
      // On prend juste la ligne actuelle (sous-question si elle existe, sinon le texte principal)
      const dbEnonceTexte = subText ? subText : mainText;

      // --- C. TEXTE COMPLET POUR L'IA (Avec contexte) ---
      const textForAI = subText ? `${currentTitle}\n${subText}` : currentTitle;
      const fullStatement = `**Contexte :**\n${currentContext}\n\n**Question :**\n${textForAI}`;

      try {
        // Appel à l'IA avec le texte complet
        const aiResult = await generateSolutionAndHints(fullStatement);

        const questionData = {
          matiere: rawMatiere,
          annee: isNaN(parsedAnnee) ? 2024 : parsedAnnee,
          session: formattedSession,
          theme: row['Thème'] || row['Theme'] || "Non classé",
          numeroExercice: String(rawNumber).trim(),
          
          // 👈 Les nouveaux champs propres, sans concaténation abusive !
          labelQuestion: dbLabelQuestion, 
          enonceTexte: dbEnonceTexte, 
          
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
        console.error(`❌ Erreur sur la question : "${dbLabelQuestion}"`, aiError?.message || aiError);
      }
    }

    if (importedQuestions.length === 0) {
      res.status(400).json({ message: "Aucune question n'a pu être générée. Vérifiez vos clés d'API IA et les entêtes Excel." });
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