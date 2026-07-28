import { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import Question from "../models/Question";

// Initialisation dynamique du client IA
const getAIClient = () => {
  const provider = process.env.AI_PROVIDER;

  switch (provider) {
    case 'GROQ':
      return new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
      });
    case 'OPENROUTER':
      return new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1"
      });
    case 'OPENAI':
    default:
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
  }
};

/**
 * Contrôleur Universel pour générer du contenu éducatif depuis un PDF
 */
export const generateContentFromPdf = async (req: Request, res: Response): Promise<void> => {
  let tempFilePath = "";

  try {
    const file = req.file;
    const { examId, subject, typeEpreuve, numeroConcoursBlanc } = req.body;
    const contentType = req.body.type || "qcm"; // qcm, flashcard, exercise, astuce, resume

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    // Gestion du fichier
    if (file.path) {
      tempFilePath = file.path;
    } else if (file.buffer) {
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, file.buffer);
    }

    // 1. Extraction locale du texte du PDF
    const dataBuffer = fs.readFileSync(tempFilePath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim() === "") {
       res.status(400).json({ message: "Le PDF est vide ou non lisible (peut-être une image sans texte)." });
       return;
    }

    // 2. Configuration du Prompt dynamique selon le type demandé
    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur expert. Génère 10 QCM pertinents à partir du texte fourni. 
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explication": "..." } ] }`;
    } else if (contentType === "exercise") {
      systemPrompt = `Tu es un professeur expert. Génère 2 exercices d'application pratiques basés sur ce texte, avec leurs corrigés détaillés.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Énoncé de l'exercice...", "explication": "Corrigé détaillé...", "options": [] } ] }`;
    } else if (contentType === "flashcard" || contentType === "astuce") {
      systemPrompt = `Tu es un professeur expert. Génère 5 flashcards/astuces de révision.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Concept ou Astuce", "explication": "Définition ou explication...", "options": [] } ] }`;
    }

    // 3. Appel à l'IA avec le client universel
    const openai = getAIClient();
    
    // Détermination du modèle selon le fournisseur
    let modelName = "gpt-4o-mini";
    if (process.env.AI_PROVIDER === 'GROQ') modelName = "llama3-8b-8192";
    if (process.env.AI_PROVIDER === 'OPENROUTER') {
  // Modèle ultra-rapide et très stable en gratuit
  modelName = "qwen/qwen-2.5-7b-instruct:free"; 
  
  // Alternative si vous voulez tester la puissance de Llama 3.3 :
  // modelName = "meta-llama/llama-3.3-70b-instruct:free";
}

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texte du document :\n${extractedText.substring(0, 15000)}` } // Limite pour éviter les dépassements de tokens
      ],
      response_format: { type: "json_object" }, // Force le format JSON (Supporté par OpenAI, Groq, et la plupart des modèles OpenRouter)
      temperature: 0.3,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide de l'IA.");

    const generatedData = JSON.parse(responseContent);

    // 4. Formatage et Sauvegarde
    const itemsToInsert = generatedData.items.map((item: any) => ({
      texte: item.question,
      options: item.options || [],
      reponseCorrecte: item.options && item.options.length > 0 ? item.options[item.correctAnswerIndex || 0] : null,
      explication: item.explication,
      type: contentType,
      subject: subject,
      exam: examId || "Concours Blanc",
      typeEpreuve: typeEpreuve || "blanc",
      numeroConcoursBlanc: numeroConcoursBlanc || null,
      note: 1
    }));

    await Question.insertMany(itemsToInsert);

    // 5. Nettoyage
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.status(200).json({ message: "Contenu généré et sauvegardé avec succès !", count: itemsToInsert.length });

  } catch (error) {
    console.error("Erreur IA:", error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    res.status(500).json({ message: "Erreur lors de la génération par l'IA.", error: error instanceof Error ? error.message : "Erreur inconnue" });
  }
};