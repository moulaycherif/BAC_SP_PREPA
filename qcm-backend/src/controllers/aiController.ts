import { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import Question from "../models/Question";
import { jsonrepair } from 'jsonrepair';

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

    // 🚨 Consigne stricte pour forcer le formatage LaTeX / KaTeX
    const baseMathInstruction = `
    RÈGLES VITALES DE FORMATAGE (POUR JSON + KATEX) :
    1. MATHÉMATIQUES COMPLETES : Encadre TOUJOURS la formule entière dans un seul bloc $. Ne hache jamais les expressions.
       - MAUVAIS : si $|x-a|, alors $f(x)-l
       - BON : si $|x-a| < \\\\delta$, alors $|f(x)-l| < \\\\varepsilon$
    2. SYMBOLES EXACTS : Utilise les vraies commandes LaTeX. N'écris JAMAIS "mathbbR", "epsilon" ou "delta" en toutes lettres. Utilise \\\\mathbb{R}, \\\\varepsilon, \\\\delta, \\\\forall, \\\\exists.
    3. DOUBLE ANTISLASH OBLIGATOIRE : Tu DOIS écrire 2 antislashs pour CHAQUE commande, sinon le code plantera.
       - Écris \\\\forall (PAS \\forall)
       - Écris \\\\frac (PAS \\frac)
    RÈGLE DE STRUCTURE : Le champ "options" doit être un tableau de simples chaînes de caractères.
    `;

    // 🧠 Configuration des Prompts (NIVEAU AVANCÉ / PRÉPA)
    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur exigeant de Baccalauréat Sciences Physiques. 
      Génère 5 QCM (PAS PLUS) de HAUT NIVEAU basés sur ce texte. 
      Les QCM doivent évaluer la réflexion (calculs, cas limites).
      CONSIGNE DE LONGUEUR : Sois CONCIS dans le champ "explication" (3 phrases maximum). N'utilise JAMAIS l'environnement LaTeX \\begin{align*} ou de longues démonstrations multi-lignes.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswerIndex": 0, "explication": "Explication brève et directe..." } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "exercise") {
      systemPrompt = `Tu es un professeur exigeant de Baccalauréat Sciences Physiques. 
     Génère 1 seul Exercice Complexe (type problème d'examen) basé sur ce texte. 
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Énoncé...", "explication": "Corrigé détaillé et CONCIS, sans développements LaTeX excessifs...", "options": [] } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "flashcard" || contentType === "astuce") {
      systemPrompt = `Tu es un expert pédagogique. Génère 5 flashcards ou astuces de niveau avancé pour retenir les concepts les plus difficiles du texte.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Concept ou Astuce à retenir", "explication": "Explication approfondie...", "options": [] } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "resume") {
      // 💡 TRANSFORMATION DU RÉSUMÉ EN FLASHCARDS DE RÉVISION
      systemPrompt = `Tu es un expert pédagogique. L'étudiant a besoin de "Flashcards de révision" ultra-efficaces et denses.
      Extrais les 4 ou 5 concepts, théorèmes ou formules les plus critiques du texte. Transforme-les en fiches mémos (Concept visé + Formule/Démonstration).
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Théorème / Concept : [Nom]", "explication": "Définition précise mathématiquement et conditions d'application...", "options": [] } ] }
      ${baseMathInstruction}`;
    } else if (contentType === "controle") {
      systemPrompt = `Tu es un concepteur de sujets d'examen niveau Baccalauréat Sciences Physiques. 
      Conçois un contrôle d'évaluation exigeant basé sur ce texte.
      UNIQUEMENT des problèmes de réflexion, des études d'expressions ou des démonstrations. AUCUNE simple restitution de connaissances ou de définitions. L'étudiant doit transpirer.
      Réponds UNIQUEMENT avec un objet JSON valide suivant cette structure exacte :
      { "items": [ { "question": "Sujet de l'exercice...", "explication": "Corrigé détaillé et barème d'évaluation...", "options": [] } ] }
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
        // 🟢 1. On réduit la taille du texte extrait pour économiser des jetons en entrée
        { role: "user", content: `Texte du document :\n${extractedText.substring(0, 10000)}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      // 🟢 2. On ajuste le max_tokens pour que (Texte + max_tokens) soit toujours inférieur à 6000
      max_tokens: 2500, 
    });

   const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide de l'IA.");

   // 🛡️ NETTOYEUR EXTRÊME ET EXTRACTEUR CHIRURGICAL

    // 1. Isoler grossièrement le bloc (du premier { au dernier })
    const firstBrace = responseContent.indexOf('{');
    const lastBrace = responseContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("L'IA n'a pas renvoyé de structure JSON.");
    }
    let rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);

    // 2. PRÉ-TRAITEMENT LATEX : Protéger les antislashs avant le parsing
    rawJsonStr = rawJsonStr
      .replace(/\\/g, '\\\\')    // Double absolument tous les antislashs (empêche \frac de devenir rac)
      .replace(/\\\\"/g, '\\"'); // Laisse les guillemets échappés intacts pour ne pas casser le JSON

    // 3. Réparer et Parser avec jsonrepair
    let generatedData;
    try {
      // jsonrepair s'occupe des virgules, accolades manquantes et du $} à la fin
      const repairedJson = jsonrepair(rawJsonStr); 
      generatedData = JSON.parse(repairedJson);
    } catch (parseError) {
      console.error("Erreur avec jsonrepair. Contenu brut :", rawJsonStr);
      throw new Error("Le format renvoyé par l'IA est totalement irrécupérable.");
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