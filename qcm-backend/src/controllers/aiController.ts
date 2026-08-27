import { Request, Response } from "express";
import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import Question from "../models/Question";
import { jsonrepair } from 'jsonrepair';
import * as xlsx from 'xlsx';

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

// Configuration des clients IA
const getAIConfig = (): { client: OpenAI | null; model: string; provider: string } => {
  const provider = (process.env.AI_PROVIDER || '').trim().toUpperCase();

  switch (provider) {
    case 'CEREBRAS':
      return {
        client: null,
        model: "llama3.1-8b",
        provider: 'CEREBRAS'
      };
    case 'GROQ':
      return {
        client: new OpenAI({ 
          apiKey: process.env.GROQ_API_KEY, 
          baseURL: "https://api.groq.com/openai/v1" 
        }),
        model: "llama-3.3-70b-versatile",
        provider: 'GROQ'
      };
    case 'OPENROUTER':
      return {
        client: new OpenAI({ 
          apiKey: process.env.OPENROUTER_API_KEY, 
          baseURL: "https://openrouter.ai/api/v1" 
        }),
        model: "meta-llama/llama-3.1-8b-instruct:free",
        provider: 'OPENROUTER'
      };
    case 'OPENAI':
    default:
      return {
        client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        model: "gpt-4o-mini",
        provider: 'OPENAI'
      };
  }
};

export const generateContentFromPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const { examId, subject, chapter, typeEpreuve, numeroConcoursBlanc } = req.body;
    const contentType = req.body.type || "qcm"; 

    if (!file) {
      res.status(400).json({ message: "Aucun fichier PDF fourni." });
      return;
    }

    let dataBuffer: Buffer;
    if (file.buffer) {
      dataBuffer = file.buffer;
    } else if (file.path) {
      dataBuffer = fs.readFileSync(file.path);
      fs.unlinkSync(file.path); 
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

    const baseMathInstruction = `
    NIVEAU CIBLE : Baccalauréat Sciences Physiques (Terminale Scientifique).
    Le contenu, le vocabulaire, la rigueur scientifique et les calculs doivent correspondre EXACTEMENT aux attentes d'une épreuve de Physique-Chimie du Bac.

    RÈGLES VITALES DE FORMATAGE (POUR JSON + KATEX) :
    1. MATHÉMATIQUES COMPLETES : Encadre TOUJOURS la formule entière dans un seul bloc $.
    2. SYMBOLES EXACTS : Utilise les vraies commandes LaTeX (\\mathbb{R}, \\varepsilon, \\delta, \\Omega).
    3. DOUBLE ANTISLASH OBLIGATOIRE : Tu DOIS écrire 2 antislashs pour CHAQUE commande (\\frac, \\lim).
    RÈGLE DE STRUCTURE : Le champ "options" doit être un tableau de simples chaînes de caractères.
    IMPORTANT : Ta réponse DOIT être uniquement un objet JSON valide, sans texte additionnel.
    `;

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

    const { client: aiClient, model: defaultModel, provider } = getAIConfig();
    let responseContent: string | undefined = undefined;

    // --- BRANCHE CEREBRAS ---
    if (provider === 'CEREBRAS') {
      let targetModel = defaultModel;
      try {
        const modelsResponse = await fetch("https://api.cerebras.ai/v1/models", {
          headers: { "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}` }
        });
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          const availableModels = modelsData.data?.map((m: any) => m.id) || [];
          if (availableModels.length > 0) {
            const llamaModel = availableModels.find((m: string) => m.toLowerCase().includes('llama'));
            targetModel = llamaModel || availableModels[0];
          }
        }
      } catch (e) {
        console.warn("Cerebras models check fallback.");
      }

      const cerebrasResponse = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemPrompt + "\n\nRÈGLE VITALE : Sois extrêmement concis. Ne répète JAMAIS la même équation. Va directement au résultat final sans boucler." },
            { role: "user", content: `Texte du document :\n${extractedText.substring(0, 10000)}` }
          ],
          temperature: 0.2,
          max_tokens: 2500
        })
      });

      if (!cerebrasResponse.ok) {
        const errorText = await cerebrasResponse.text();
        throw new Error(`Erreur API Cerebras HTTP ${cerebrasResponse.status}: ${errorText}`);
      }

      const responseData = await cerebrasResponse.json();
      responseContent = responseData.choices?.[0]?.message?.content;

    // --- BRANCHE GROQ, OPENROUTER OU OPENAI ---
    } else if (aiClient) {

      if (provider === 'GROQ') {
        let groqCandidateModels: string[] = [];

        // Option B : Récupération dynamique des modèles actifs depuis l'API Groq
        try {
          console.log("[GROQ] Récupération dynamique de la liste des modèles actifs...");
          const modelsList = await aiClient.models.list();
          const availableIds: string[] = modelsList.data.map((m: any) => m.id);

          // Filtrer les modèles pour ne garder que ceux destinés à la génération de texte/chat (exclure whisper, guard, etc.)
          groqCandidateModels = availableIds.filter((id: string) => {
            const lower = id.toLowerCase();
            return !lower.includes('whisper') && 
                   !lower.includes('guard') && 
                   !lower.includes('embed') && 
                   !lower.includes('vision');
          });

          console.log(`[GROQ] Modèles de génération détectés (${groqCandidateModels.length}) :`, groqCandidateModels);
        } catch (e: any) {
          console.warn(`[GROQ] Impossible de récupérer la liste dynamique (${e.message}). Utilisation de la liste de secours.`);
        }

        // Si la liste dynamique est vide ou indisponible, on applique une liste de secours à jour
        if (groqCandidateModels.length === 0) {
          groqCandidateModels = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b"
          ];
        }

        let lastError: any = null;

        for (const candidateModel of groqCandidateModels) {
          try {
            console.log(`[GROQ] Tentative de génération avec le modèle : ${candidateModel}...`);
            const response = await aiClient.chat.completions.create({
              model: candidateModel,
              messages: [
                { role: "system", content: systemPrompt + "\n\nRÈGLE VITALE : Sois extrêmement concis. Ne répète JAMAIS la même équation. Va directement au résultat final sans boucler." },
                { role: "user", content: `Texte du document :\n${extractedText.substring(0, 10000)}` }
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
              max_tokens: 2500
            });

            responseContent = response.choices[0]?.message?.content || undefined;
            if (responseContent) {
              console.log(`[GROQ] Succès avec le modèle : ${candidateModel}`);
              break; // Succès ! On sort de la boucle immédiatement.
            }
          } catch (err: any) {
            console.warn(`[GROQ] Le modèle ${candidateModel} a échoué (${err.message}). Essai du suivant...`);
            lastError = err;
          }
        }

        if (!responseContent) {
          throw new Error(`Tous les modèles Groq ont échoué. Dernière erreur : ${lastError?.message || "Erreur inconnue"}`);
        }

      } else {
        // Mode OpenAI / OpenRouter standard
        const response = await aiClient.chat.completions.create({
          model: defaultModel,
          messages: [
            { role: "system", content: systemPrompt + "\n\nRÈGLE VITALE : Sois extrêmement concis. Ne répète JAMAIS la même équation. Va directement au résultat final sans boucler." },
            { role: "user", content: `Texte du document :\n${extractedText.substring(0, 10000)}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2500
        });
        responseContent = response.choices[0]?.message?.content || undefined;
      }
    }

    if (!responseContent) throw new Error("Réponse vide de l'IA.");

    const firstBrace = responseContent.indexOf('{');
    const lastBrace = responseContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("L'IA n'a pas renvoyé de JSON.");
    
    const rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);

    let generatedData: IAGeneratedData;
    try {
      const repairedJson = jsonrepair(rawJsonStr); 
      generatedData = JSON.parse(repairedJson);
    } catch (parseError) {
      throw new Error("Le format renvoyé par l'IA est irrécupérable.");
    }

    if (!generatedData || !Array.isArray(generatedData.items)) {
      throw new Error("La structure JSON retournée par l'IA ne contient pas le tableau 'items' attendu.");
    }

    const isControle = contentType === "controle";
    const finalExamName = isControle ? "Contrôle IA" : (examId || "Support de cours IA");
    const finalTypeEpreuve = isControle ? "blanc" : "ia"; 

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

    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Generations_IA");
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="Generations_IA_${contentType}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

  } catch (error) {
    console.error("Erreur IA:", error);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
    res.status(500).json({ message: "Erreur lors de la génération par l'IA.", error: error instanceof Error ? error.message : "Erreur inconnue" });
  }
};

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
  
      const itemsToInsert = rawData.map(row => {
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