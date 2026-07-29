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
    const { examId, subject, chapter, typeEpreuve, numeroConcoursBlanc } = req.body;
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

    // 👇 NOUVEAU : Consigne stricte pour forcer le formatage LaTeX / KaTeX
    const baseMathInstruction = `
    🚨 RÈGLES STRICTES DE FORMATAGE MATHÉMATIQUE (KATEX/LATEX) 🚨 :
    Tu dois IMPÉRATIVEMENT encadrer TOUTES les formules, variables, fractions et symboles mathématiques avec le délimiteur $ pour qu'ils soient interprétés correctement par le frontend.
    - MAUVAIS : La limite de x tend vers +infini de f(x) = x^2 + 1
    - BON : La limite de $x$ tend vers $+\\infty$ de $f(x) = x^2 + 1$
    N'utilise jamais de texte brut pour les expressions mathématiques ou physiques.
    ATTENTION CRUCIALE : Puisque tu réponds au format JSON, tu dois DOUBLER les antislashs de tes commandes LaTeX pour qu'elles ne soient pas effacées lors du parsing JSON (exemple : écris \\\\frac au lieu de \\frac, et \\\\infty au lieu de \\infty).
    `;

    // 2. Configuration du Prompt dynamique selon le type demandé
    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur expert. Génère 10 QCM pertinents à partir du texte fourni. 
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explication": "..." } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "exercise") {
      systemPrompt = `Tu es un professeur expert. Génère 2 exercices d'application pratiques basés sur ce texte, avec leurs corrigés détaillés.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Énoncé de l'exercice...", "explication": "Corrigé détaillé...", "options": [] } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "flashcard" || contentType === "astuce") {
      systemPrompt = `Tu es un professeur expert. Génère 5 flashcards/astuces de révision.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Concept ou Astuce", "explication": "Définition ou explication...", "options": [] } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "resume") {
      systemPrompt = `Tu es un professeur expert. Génère un résumé clair et structuré des points clés de ce texte. Découpe-le en 3 à 5 sections importantes.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Titre de la section", "explication": "Contenu du résumé pour cette section...", "options": [] } ] }
      ${baseMathInstruction}`;
    }

    // 3. Appel à l'IA avec le client universel
    const openai = getAIClient();
    
    // Détermination du modèle selon le fournisseur
    let modelName = "gpt-4o-mini"; // Par défaut

    if (process.env.AI_PROVIDER === 'GROQ') {
      modelName = "llama-3.1-8b-instant"; // 👈 Modèle officiel Groq (gratuit et ultra-rapide)
    }

    if (process.env.AI_PROVIDER === 'OPENROUTER') {
      modelName = "meta-llama/llama-3.3-70b-instruct:free";
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
    // On détermine les étiquettes correctes pour ne pas polluer les concours blancs
    const isControle = contentType === "controle";
    const finalExamName = isControle ? "Contrôle IA" : (examId || "Support de cours IA");
    
    // On utilise "ia" (ou "chapitre") pour ne pas déclencher l'affichage dans les examens
    const finalTypeEpreuve = isControle ? "blanc" : "ia"; 

    const itemsToInsert = generatedData.items.map((item: any) => ({
      texte: item.question,
      options: item.options || [],
      reponseCorrecte: item.options && item.options.length > 0 ? item.options[item.correctAnswerIndex || 0] : null,
      explication: item.explication,
      type: contentType,
      subject: subject,
      chapter: chapter || null, 
      exam: finalExamName,             
      typeEpreuve: finalTypeEpreuve,
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