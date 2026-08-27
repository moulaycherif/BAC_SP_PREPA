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

// Configuration : OpenAI, Groq et OpenRouter utilisent le SDK. Cerebras est traité séparément.
const getAIConfig = (): { client: OpenAI | null; model: string; provider: string } => {
  const provider = (process.env.AI_PROVIDER || '').trim().toUpperCase();

  switch (provider) {
    case 'CEREBRAS':
      return {
        client: null, // On n'utilise pas le SDK OpenAI pour Cerebras
        model: "llama3.1-8b",
        provider: 'CEREBRAS'
      };
    case 'GROQ':
      return {
        client: new OpenAI({ 
          apiKey: process.env.GROQ_API_KEY, 
          baseURL: "https://api.groq.com/openai/v1" 
        }),
        model: "llama-3.1-8b-instant", // Valeur par défaut, mais elle sera écrasée dynamiquement
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

    const { client: aiClient, model: modelName, provider } = getAIConfig();
    let responseContent: string | undefined = "";

    if (provider === 'CEREBRAS') {
      let targetModel = modelName;
      try {
        const modelsResponse = await fetch("https://api.cerebras.ai/v1/models", {
          headers: { "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}` }
        });
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          const availableModels = modelsData.data?.map((m: any) => m.id) || [];
          
          if (availableModels.length > 0) {
            const llamaModel = availableModels.find((m: string) => m.toLowerCase().includes('llama'));
            if (llamaModel) {
              targetModel = llamaModel;
            } else {
              targetModel = availableModels[0]; 
            }
            console.log(`Modèle Cerebras dynamique sélectionné : ${targetModel}`);
          }
        }
      } catch (e) {
        console.warn("Impossible de lister les modèles Cerebras, utilisation de la valeur par défaut.");
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

    } else if (aiClient) {
      
      let finalModelName = modelName;

      // 🌟 NOUVEAU : Auto-détection du modèle pour Groq avec filtre anti-utilitaires
      if (provider === 'GROQ') {
        try {
          const response = await aiClient.models.list();
          const availableModels = response.data.map((m: any) => m.id);
          
          // Liste élargie de modèles performants
          const preferredModels = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'llama-3.1-70b-versatile',
            'llama3-8b-8192',
            'llama3-70b-8192',
            'mixtral-8x7b-32768',
            'gemma2-9b-it'
          ];

          let found = false;
          for (const pref of preferredModels) {
            if (availableModels.includes(pref)) {
              finalModelName = pref;
              found = true;
              break;
            }
          }

          // Fallback intelligent : on exclut les modèles de sécurité (guard) ou audio (whisper)
          if (!found && availableModels.length > 0) {
            const safeFallback = availableModels.find((m: string) => {
              const name = m.toLowerCase();
              const isGenerativeAI = name.includes('llama') || name.includes('mixtral') || name.includes('gemma');
              const isNotUtility = !name.includes('guard') && !name.includes('whisper') && !name.includes('vision');
              return isGenerativeAI && isNotUtility;
            });
            
            if (safeFallback) {
              finalModelName = safeFallback;
            } else {
              throw new Error("Aucun modèle de génération de texte standard (Llama, Mixtral, Gemma) n'est disponible sur votre compte Groq.");
            }
          }
          console.log(`Modèle Groq dynamique sélectionné : ${finalModelName}`);
        } catch (e: any) {
          console.warn("Impossible de lister les modèles Groq ou erreur de sécurité :", e.message);
        }
      }

      // Logique de requête pour OpenAI, Groq (avec modèle dynamique), OpenRouter
      const response = await aiClient.chat.completions.create({
        model: finalModelName, // 👈 Utilisation du modèle sélectionné dynamiquement
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
    // Le code de l'import reste identique
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