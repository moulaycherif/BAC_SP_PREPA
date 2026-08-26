import { Request, Response } from "express";
import fs from "fs";
import pdfParse from "pdf-parse"; // os et path ont été retirés car devenus inutiles
import OpenAI from "openai";
import Question from "../models/Question";
import { jsonrepair } from 'jsonrepair';
import * as xlsx from 'xlsx';

// Typage strict pour éviter les erreurs "any"
interface IAItemResponse {
  question?: string;
  options?: string[];
  correctAnswerIndex?: number;
  reponseCorrecte?: string | number;
  explication?: string;
}

interface IAGeneratedData {
  items: IAItemResponse[];
}

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
  try {
    const file = req.file;
    const { examId, subject, chapter, typeEpreuve, numeroConcoursBlanc } = req.body;
    const contentType = req.body.type || "qcm"; 

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    // Gestion optimisée en mémoire (pas d'écriture inutile sur le disque dur)
    let dataBuffer: Buffer;
    if (file.buffer) {
      dataBuffer = file.buffer;
    } else if (file.path) {
      dataBuffer = fs.readFileSync(file.path);
      fs.unlinkSync(file.path); // Nettoyage immédiat du disque
    } else {
      res.status(400).json({ message: "Format de fichier non supporté." });
      return;
    }

    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim() === "") {
       res.status(400).json({ message: "Le PDF est vide ou non lisible." });
       return;
    }

    // Instructions générales renforcées pour le Bac Sciences Physiques
    const baseMathInstruction = `
    NIVEAU CIBLE : Baccalauréat Sciences Physiques (Terminale Scientifique).
    Le contenu, le vocabulaire, la rigueur scientifique et les calculs doivent correspondre EXACTEMENT aux attentes d'une épreuve de Physique-Chimie du Bac.

    RÈGLES VITALES DE FORMATAGE (POUR JSON + KATEX) :
    1. MATHÉMATIQUES COMPLETES : Encadre TOUJOURS la formule entière dans un seul bloc $.
    2. SYMBOLES EXACTS : Utilise les vraies commandes LaTeX (\\mathbb{R}, \\varepsilon, \\delta, \\Omega).
    3. DOUBLE ANTISLASH OBLIGATOIRE : Tu DOIS écrire 2 antislashs pour CHAQUE commande (\\frac, \\lim).
    RÈGLE DE STRUCTURE : Le champ "options" doit être un tableau de simples chaînes de caractères.
    `;

    // Personnalisation selon le type (Orienté Physique-Chimie)
    let systemPrompt = "";
    if (contentType === "qcm") {
      systemPrompt = `Tu es un professeur expert de Physique-Chimie. Génère 5 QCM (PAS PLUS) de HAUT NIVEAU (type Bac Sciences Physiques) basés sur ce texte. L'étudiant doit raisonner et faire des calculs.
      Réponds avec JSON strict : { "items": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explication": "..." } ] } \n${baseMathInstruction}`;
    } else if (contentType === "exercise") {
      systemPrompt = `Tu es un professeur expert de Physique-Chimie. Génère 1 seul Exercice Complexe (type problème de l'épreuve du Bac Sciences Physiques) basé sur ce texte.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "flashcard" || contentType === "astuce") {
      systemPrompt = `Génère 5 flashcards ou astuces de niveau avancé, indispensables pour préparer l'épreuve du Bac Sciences Physiques.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "resume") {
      systemPrompt = `Extrais les 4-5 concepts, lois physiques ou théorèmes chimiques critiques niveau Bac Sciences Physiques présents dans le document. 
      Réponds avec JSON strict : { "items": [ { "question": "Loi/Théorème: ...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    } else if (contentType === "controle") {
      systemPrompt = `Conçois un contrôle d'évaluation exigeant type Baccalauréat Sciences Physiques basé sur ce texte. L'étudiant doit transpirer et mobiliser plusieurs concepts.
      Réponds avec JSON strict : { "items": [ { "question": "...", "explication": "...", "options": [] } ] } \n${baseMathInstruction}`;
    }

    const openai = getAIClient();
    let modelName = "gpt-4o-mini"; 
    if (process.env.AI_PROVIDER === 'GROQ') modelName = "llama3-8b-8192";
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
    
    // Le replace capricieux a été retiré. jsonrepair fera le travail proprement.
    const rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);

    let generatedData: IAGeneratedData;
    try {
      const repairedJson = jsonrepair(rawJsonStr); 
      generatedData = JSON.parse(repairedJson);
    } catch (parseError) {
      throw new Error("Le format renvoyé par l'IA est irrécupérable.");
    }

    // Sécurité Anti-Crash : On s'assure que "items" existe bien
    if (!generatedData || !Array.isArray(generatedData.items)) {
      throw new Error("La structure JSON retournée par l'IA ne contient pas le tableau 'items' attendu.");
    }

    const isControle = contentType === "controle";
    const finalExamName = isControle ? "Contrôle IA" : (examId || "Support de cours IA");
    const finalTypeEpreuve = isControle ? "blanc" : "ia"; 

    // Transformation en format plat pour Excel avec Typage Fort
    const excelRows = generatedData.items.map((item: IAItemResponse) => {
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
        Options: cleanOptions.join(" || "),
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

    // Envoi du fichier Excel
    res.setHeader('Content-Disposition', `attachment; filename="Generations_IA_${contentType}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error("Erreur IA:", error);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Sécurité anti-fuite de mémoire
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

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      buffer = fs.readFileSync(file.path);
    } else {
      res.status(400).json({ message: "Fichier illisible." });
      return;
    }

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      res.status(400).json({ message: "Le fichier Excel est vide." });
      return;
    }

    // Reconstruction du format Base de Données
    const itemsToInsert = rawData.map(row => {
      // Nettoyage robuste des espaces autour des "||"
      const optionsArray = row.Options 
        ? String(row.Options).split(" || ").map(opt => opt.trim()).filter(opt => opt !== "") 
        : [];

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

    await Question.insertMany(itemsToInsert);

    if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    res.status(200).json({ message: "Excel corrigé importé avec succès !", count: itemsToInsert.length });
  } catch (error) {
    console.error("Erreur Import Excel IA :", error);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Erreur lors de l'importation de l'Excel corrigé." });
  }
};