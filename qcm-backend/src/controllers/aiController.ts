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
    const contentType = req.body.type || "qcm"; // qcm, flashcard, exercise, astuce, resume, controle

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

    // Consigne stricte pour forcer le formatage LaTeX / KaTeX
    const baseMathInstruction = `
    🚨 RÈGLES VITALES DE FORMATAGE MATHÉMATIQUE (POUR JSON + KATEX) 🚨 :
    1. Tu dois IMPÉRATIVEMENT encadrer TOUTES les formules, variables isolées (f, x, a, y...), fractions et symboles avec le délimiteur $. 
       - MAUVAIS : Soit f(x) = 1/x et a=1.
       - BON : Soit $f(x) = \\\\frac{1}{x}$ et $a=1$.
    2. DANGER JSON : Tu dois OBLIGATOIREMENT "échapper" (doubler) chaque antislash LaTeX.
       - Écris "\\\\frac" au lieu de "\\frac".
       - Écris "\\\\forall" au lieu de "\\forall".
       - Écris "\\\\varepsilon" au lieu de "epsilon" ou "\\varepsilon".
       - Écris "+\\\\infty" au lieu de "+infty" ou "+\\infty".
    3. N'écris JAMAIS les symboles en toutes lettres.
    4. Ne coupe pas les formules ! Encadre l'intégralité de l'expression mathématique dans un seul bloc $.
    RÈGLE DE STRUCTURE : Le champ "options" doit être un tableau de simples chaînes de caractères.
    `;

    // 2. Configuration du Prompt dynamique selon le type demandé
    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur expert. Génère 10 QCM pertinents à partir du texte fourni. 
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswerIndex": 0, "explication": "..." } ] }
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
    } else if (contentType === "controle") {
      systemPrompt = `Tu es un professeur expert. Conçois un contrôle d'évaluation basé sur ce texte.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Énoncé complet de la question...", "explication": "Corrigé détaillé et barème...", "options": [] } ] }
      ${baseMathInstruction}`;
    }

    // 3. Appel à l'IA avec le client universel
    const openai = getAIClient();
    
    let modelName = "gpt-4o-mini"; // Par défaut

    if (process.env.AI_PROVIDER === 'GROQ') {
      modelName = "llama-3.1-8b-instant";
    }

    if (process.env.AI_PROVIDER === 'OPENROUTER') {
      modelName = "meta-llama/llama-3.3-70b-instruct:free";
    }

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texte du document :\n${extractedText.substring(0, 15000)}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

   const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide de l'IA.");

    // 🛡️ BOUCLIER ANTI-CRASH : On corrige les antislashs oubliés par l'IA avant de lire le JSON.
    // Si l'IA a écrit "\frac" (invalide en JSON), on le transforme en "\\frac" (valide).
    const cleanResponseContent = responseContent.replace(/\\(?!["\\/bfnrt])/g, "\\\\");

    let generatedData;
    try {
      generatedData = JSON.parse(cleanResponseContent);
    } catch (parseError) {
      console.error("Erreur de parsing JSON de l'IA :", parseError);
      console.error("Contenu brut :", cleanResponseContent);
      throw new Error("L'IA a généré un format de données invalide.");
    }

    // 4. Formatage et Sauvegarde avec Assainissement (Sanitization) des types
    const isControle = contentType === "controle";
    const finalExamName = isControle ? "Contrôle IA" : (examId || "Support de cours IA");
    const finalTypeEpreuve = isControle ? "blanc" : "ia"; 

    const itemsToInsert = generatedData.items.map((item: any) => {
      // 🛡️ ASSAINISSEMENT DES OPTIONS : Forcer la conversion en chaînes simples (string[])
      let rawOptions = item.options || [];
      let cleanOptions: string[] = [];

      if (Array.isArray(rawOptions)) {
        cleanOptions = rawOptions.map((opt: any) => {
          if (typeof opt === 'object' && opt !== null) {
            // Si l'IA a renvoyé { a: '0' }, on extrait la valeur '0'
            const values = Object.values(opt);
            return values.length > 0 ? String(values[0]) : JSON.stringify(opt);
          }
          return String(opt);
        });
      }

      // 🛡️ ASSAINISSEMENT DE LA REPONSE CORRECTE : Forcer la conversion en chaîne simple (string)
      let cleanReponseCorrecte: string | null = null;
      if (cleanOptions.length > 0) {
        const idx = typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0;
        cleanReponseCorrecte = cleanOptions[idx] || cleanOptions[0];
      } else if (item.reponseCorrecte) {
        if (typeof item.reponseCorrecte === 'object' && item.reponseCorrecte !== null) {
          const values = Object.values(item.reponseCorrecte);
          cleanReponseCorrecte = values.length > 0 ? String(values[0]) : null;
        } else {
          cleanReponseCorrecte = String(item.reponseCorrecte);
        }
      }

      return {
        texte: item.question,
        options: cleanOptions,
        reponseCorrecte: cleanReponseCorrecte,
        explication: item.explication,
        type: contentType,
        subject: subject,
        chapter: chapter || null, 
        exam: finalExamName,             
        typeEpreuve: finalTypeEpreuve,
        numeroConcoursBlanc: numeroConcoursBlanc || null,
        note: 1
      };
    });

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