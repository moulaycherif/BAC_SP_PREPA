import { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import Question from "../models/Question";
import { jsonrepair } from 'jsonrepair';
import * as xlsx from 'xlsx';

// Initialisation dynamique du client IA
const getAIClient = () => {
  const provider = process.env.AI_PROVIDER;
  switch (provider) {
    case 'GROQ':
      return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    case 'OPENROUTER':
      return new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
    case 'OPENAI':
    default:
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
};

/**
 * 1️⃣ GÉNÉRATION : Appelle l'IA et renvoie un fichier EXCEL (Human-in-the-Loop)
 */
export const generateContentFromPdf = async (req: Request, res: Response): Promise<void> => {
  let tempFilePath = "";

  try {
    const file = req.file;
    const { examId, subject, chapter, typeEpreuve, numeroConcoursBlanc } = req.body;
    const contentType = req.body.type || "qcm"; 

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    if (file.path) {
      tempFilePath = file.path;
    } else if (file.buffer) {
      tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, file.buffer);
    }

    const dataBuffer = fs.readFileSync(tempFilePath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim() === "") {
       res.status(400).json({ message: "Le PDF est vide ou non lisible." });
       return;
    }

    const baseMathInstruction = `
    RÈGLES VITALES DE FORMATAGE (POUR JSON + KATEX) :
    1. MATHÉMATIQUES COMPLETES : Encadre TOUJOURS la formule entière dans un seul bloc $.
    2. SYMBOLES EXACTS : Utilise les vraies commandes LaTeX (\\\\mathbb{R}, \\\\varepsilon, \\\\delta).
    3. DOUBLE ANTISLASH OBLIGATOIRE : Tu DOIS écrire 2 antislashs pour CHAQUE commande (\\\\frac, \\\\lim).
    RÈGLE DE STRUCTURE : Le champ "options" doit être un tableau de simples chaînes de caractères.
    `;

    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur exigeant de Bac. Génère 5 QCM (PAS PLUS) de HAUT NIVEAU basés sur ce texte.
      Réponds avec JSON strict : { "items": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explication": "..." } ] } \n${baseMathInstruction}`;
    } else if (contentType === "exercise") {
      systemPrompt = `Tu es un professeur de Bac. Génère 1 seul Exercice Complexe basé sur ce texte.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "flashcard" || contentType === "astuce") {
      systemPrompt = `Génère 5 flashcards ou astuces niveau avancé.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "resume") {
      systemPrompt = `Extrais les 4-5 concepts critiques. 
      Réponds avec JSON strict : { "items": [ { "question": "Théorème: ...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "controle") {
      systemPrompt = `Conçois un contrôle d'évaluation exigeant basé sur ce texte. L'étudiant doit transpirer.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    }

    const openai = getAIClient();
    let modelName = "gpt-4o-mini"; 
    if (process.env.AI_PROVIDER === 'GROQ') modelName = "llama-3.1-8b-instant";
    if (process.env.AI_PROVIDER === 'OPENROUTER') modelName = "meta-llama/llama-3.3-70b-instruct:free";

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt + "\n\nRÈGLE VITALE : Sois extrêmement concis. Ne répète JAMAIS la même équation. Va directement au résultat final sans boucler." },
        { role: "user", content: `Texte du document :\n${extractedText.substring(0, 10000)}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, 
      frequency_penalty: 0.8, 
      presence_penalty: 0.3,
      max_tokens: 2500, 
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide de l'IA.");

    const firstBrace = responseContent.indexOf('{');
    const lastBrace = responseContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("L'IA n'a pas renvoyé de JSON.");
    
    let rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);
    rawJsonStr = rawJsonStr.replace(/\\/g, '\\\\').replace(/\\\\"/g, '\\"');

    let generatedData;
    try {
      const repairedJson = jsonrepair(rawJsonStr); 
      generatedData = JSON.parse(repairedJson);
    } catch (parseError) {
      throw new Error("Le format renvoyé par l'IA est irrécupérable.");
    }

    // Préparation des métadonnées pour garder une trace
    const isControle = contentType === "controle";
    const finalExamName = isControle ? "Contrôle IA" : (examId || "Support de cours IA");
    const finalTypeEpreuve = isControle ? "blanc" : "ia"; 

    // Transformation en format plat pour Excel
    const excelRows = generatedData.items.map((item: any, index: number) => {
      let rawOptions = item.options || [];
      let cleanOptions = Array.isArray(rawOptions) ? rawOptions.map(String) : [];
      
      let cleanReponseCorrecte = "";
      if (cleanOptions.length > 0) {
        const idx = typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0;
        cleanReponseCorrecte = cleanOptions[idx] || cleanOptions[0];
      } else if (item.reponseCorrecte) {
        cleanReponseCorrecte = String(item.reponseCorrecte);
      }

      return {
        Question: item.question || "",
        Options: cleanOptions.join(" || "), // On sépare les options avec " || "
        ReponseCorrecte: cleanReponseCorrecte,
        Explication: item.explication || "",
        Type: contentType,
        Sujet: subject || "",
        Chapitre: chapter || "",
        Examen: finalExamName,
        TypeEpreuve: finalTypeEpreuve,
        NumConcoursBlanc: numeroConcoursBlanc || ""
      };
    });

    // Création du fichier Excel en mémoire
    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Generations_IA");
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Nettoyage du PDF
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // Envoi du fichier Excel au navigateur (téléchargement direct)
    res.setHeader('Content-Disposition', `attachment; filename="Generations_IA_${contentType}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error("Erreur IA:", error);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    res.status(500).json({ message: "Erreur lors de la génération par l'IA.", error: error instanceof Error ? error.message : "Erreur inconnue" });
  }
};

/**
 * 2️⃣ IMPORTATION : Route pour recevoir l'Excel corrigé et le sauvegarder en BDD
 */
export const importCorrectedExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Aucun fichier Excel fourni." });
      return;
    }

    // Lecture du fichier (buffer ou disque selon la config Multer)
    let buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      buffer = fs.readFileSync(file.path);
    }

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = xlsx.utils.sheet_to_json(worksheet);

    // Reconstruction du format Base de Données
    const itemsToInsert = rawData.map(row => {
      // Re-séparer les options avec " || "
      const optionsArray = row.Options ? String(row.Options).split(" || ").filter(opt => opt.trim() !== "") : [];

      return {
        texte: row.Question,
        options: optionsArray,
        reponseCorrecte: row.ReponseCorrecte ? String(row.ReponseCorrecte) : null,
        explication: row.Explication || "",
        type: row.Type || "qcm",
        subject: row.Sujet || null,
        chapter: row.Chapitre || null,
        exam: row.Examen || "Support de cours IA",
        typeEpreuve: row.TypeEpreuve || "ia",
        numeroConcoursBlanc: row.NumConcoursBlanc || null,
        note: 1
      };
    });

    // Sauvegarde officielle dans MongoDB
    await Question.insertMany(itemsToInsert);

    // Nettoyage du fichier temporaire d'upload
    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.status(200).json({ message: "Excel corrigé importé avec succès !", count: itemsToInsert.length });
  } catch (error) {
    console.error("Erreur Import Excel IA :", error);
    res.status(500).json({ message: "Erreur lors de l'importation de l'Excel corrigé." });
  }
};