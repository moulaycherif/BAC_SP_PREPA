import { Request, Response } from "express";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import os from "os";
import path from "path";
import Question from "../models/Question";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

// Vérification de la clé API
const apiKey = process.env.GEMINI_API_KEY as string;
if (!apiKey) {
  console.error("⚠️ GEMINI_API_KEY est manquante dans les variables d'environnement.");
}

// Initialisation des services Gemini
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Définition stricte du schéma JSON attendu
const qcmSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    qcms: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING, description: "Le texte de la question à choix multiples." },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Les 4 options de réponse possibles." },
          correctAnswerIndex: { type: SchemaType.INTEGER, description: "L'index (de 0 à 3) de la bonne réponse dans le tableau d'options." },
          explication: { type: SchemaType.STRING, description: "Une brève explication justifiant la bonne réponse." },
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
  let tempFilePath = "";

  try {
    const file = req.file;
    const { examId, subject } = req.body;

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    // Gestion du stockage en mémoire vs stockage disque
    if (file.path) {
      tempFilePath = file.path;
    } else if (file.buffer) {
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, file.buffer);
    } else {
      res.status(400).json({ message: "Erreur lors de la lecture du fichier." });
      return;
    }

    // 1. Upload du fichier vers Gemini
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.mimetype || "application/pdf",
      displayName: file.originalname || "document.pdf",
    });

    // 2. Configuration du modèle avec le modèle officiel gemini-2.0-flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // 👈 NOM DU MODÈLE OFFICIEL
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
      texte: q.question, 
      options: q.options, 
      reponseCorrecte: q.options[q.correctAnswerIndex], 
      explication: q.explication, 
      type: "qcm", 
      subject: subject, 
      exam: examId || "Concours Blanc", 
      typeEpreuve: req.body.typeEpreuve || "blanc", 
      numeroConcoursBlanc: req.body.numeroConcoursBlanc || null,
      note: 1
    }));

    // 6. Sauvegarde en masse dans la base de données
    await Question.insertMany(questionsToInsert);

    // 7. Nettoyage du fichier temporaire local
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // 8. Réponse au client
    res.status(200).json({
      message: "QCM générés et sauvegardés avec succès !",
      count: questionsToInsert.length,
    });

  } catch (error) {
    console.error("Erreur lors de la génération IA:", error);
    
    // Nettoyage en cas d'erreur
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(500).json({
      message: "Erreur lors de la génération des QCM par l'IA.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};