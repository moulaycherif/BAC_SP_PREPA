import { Request, Response } from "express";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import Question from "../models/Question"; // Assurez-vous que le chemin correspond à votre structure

// Vérification de la clé API
const apiKey = process.env.GEMINI_API_KEY as string;
if (!apiKey) {
  console.error("⚠️ GEMINI_API_KEY est manquante dans les variables d'environnement.");
}

// Initialisation des services Gemini
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Définition stricte du schéma JSON attendu de la part de l'IA
const qcmSchema = {
  type: SchemaType.OBJECT,
  properties: {
    qcms: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: {
            type: SchemaType.STRING,
            description: "Le texte de la question à choix multiples.",
          },
          options: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
            description: "Les 4 options de réponse possibles.",
          },
          correctAnswerIndex: {
            type: SchemaType.INTEGER,
            description: "L'index (de 0 à 3) de la bonne réponse dans le tableau d'options.",
          },
          explication: {
            type: SchemaType.STRING,
            description: "Une brève explication justifiant la bonne réponse.",
          },
        },
        required: ["question", "options", "correctAnswerIndex", "explication"],
      },
    },
  },
  required: ["qcms"],
};

/**
 * Contrôleur pour générer et sauvegarder des QCM à partir d'un fichier PDF via Gemini AI
 */
export const generateQcmFromPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.file est injecté par le middleware Multer
    const file = req.file;
    const { examId, subject } = req.body;

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    // 1. Upload du fichier vers l'infrastructure sécurisée de Gemini
    const uploadResult = await fileManager.uploadFile(file.path, {
      mimeType: "application/pdf",
      displayName: file.originalname,
    });

    // 2. Configuration du modèle avec le schéma JSON forcé
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: qcmSchema,
      },
    });

    const prompt = "Génère 10 questions à choix multiples (QCM) basées strictement sur le contenu de ce document. Assure-toi que les questions sont pertinentes pour un niveau académique/concours. Chaque QCM doit avoir 4 options avec une seule bonne réponse.";

    // 3. Appel à l'IA
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: prompt },
    ]);

    // 4. Extraction et parsing de la réponse
    const responseText = result.response.text();
    const generatedData = JSON.parse(responseText);

   // 5. Formatage pour correspondre au modèle Mongoose "Question"
    const questionsToInsert = generatedData.qcms.map((q: any) => ({
      texte: q.question, // 📌 Correspond à la colonne "Question"
      options: q.options, // 📌 Formaté en tableau de string (OptionA à OptionE)
      reponseCorrecte: q.options[q.correctAnswerIndex], // 📌 Correspond à "BonneReponse"
      explication: q.explication, // 📌 Correspond à "Explication"
      type: "qcm", // 📌 Différenciateur de type
      subject: subject, // Envoyé depuis le frontend
      exam: examId || "Concours Blanc", // Utilise votre champ "exam"
      typeEpreuve: req.body.typeEpreuve || "blanc", // À injecter depuis le front, ou "blanc" par défaut
      numeroConcoursBlanc: req.body.numeroConcoursBlanc || null,
      note: 1
      // Les autres champs (isGroup, isFree, image) utiliseront les 'default' de votre schéma Mongoose.
    }));

    // 6. Sauvegarde en masse dans la base de données
    await Question.insertMany(questionsToInsert);

    // 7. Nettoyage du fichier temporaire local
    fs.unlinkSync(file.path);

    // 8. Réponse au client
    res.status(200).json({
      message: "QCM générés et sauvegardés avec succès !",
      count: questionsToInsert.length,
    });

  } catch (error) {
    console.error("Erreur lors de la génération IA:", error);
    
    // Sécurité : S'assurer que le fichier est supprimé même si l'IA ou la BDD échoue
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Erreur lors de la génération des QCM par l'IA.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};