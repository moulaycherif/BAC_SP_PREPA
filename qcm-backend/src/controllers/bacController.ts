import OpenAI from "openai";
import BacExam from "../models/BacExam";
import { Request, Response } from "express";
import { jsonrepair } from "jsonrepair";

// 🛡️ Initialisation avec OPENROUTER (via le SDK OpenAI)
let openai: OpenAI | null = null;

try {
  if (process.env.OPENROUTER_API_KEY) {
    openai = new OpenAI({ 
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  } else {
    console.warn("⚠️ AVERTISSEMENT : OPENROUTER_API_KEY est manquante.");
  }
} catch (error) {
  console.error("Erreur lors de l'initialisation de l'IA :", error);
}

/**
 * 1️⃣ Obtenir les filtres disponibles (Années, Sessions, Thèmes)
 */
export const getFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matiere } = req.query;
    const filterQuery: Record<string, any> = {};
    
    if (matiere) {
      filterQuery.matiere = { $regex: new RegExp(`^${matiere}$`, "i") };
    }

    const years = await BacExam.distinct("annee", filterQuery);
    const sessions = await BacExam.distinct("session", filterQuery);
    const themes = await BacExam.distinct("theme", filterQuery);

    const sortedYears = years.sort((a, b) => (b as number) - (a as number));

    res.status(200).json({
      years: sortedYears,
      sessions,
      themes
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des filtres Bac:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des filtres." });
  }
};

/**
 * 2️⃣ Récupérer un (ou plusieurs) exercice(s) selon les critères choisis
 */
export const getExercisesByFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matiere, annee, session, theme } = req.query;
    const query: Record<string, any> = {};
    
    if (matiere) query.matiere = { $regex: new RegExp(`^${matiere}$`, "i") };
    if (annee) query.annee = Number(annee);
    if (session) query.session = session;
    if (theme && theme !== "Toute l'épreuve" && theme !== "toute-lepreuve") {
      query.theme = theme;
    }

    const exercises = await BacExam.find(query);

    if (exercises.length === 0) {
      res.status(404).json({ message: "Aucun exercice trouvé pour ces critères." });
      return;
    }

    res.status(200).json(exercises);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'examen Bac:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'épreuve." });
  }
};

/**
 * 3️⃣ Ajouter un nouvel exercice Bac depuis le panneau Admin
 */
export const createBacExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const newExercise = new BacExam(req.body);
    const savedExercise = await newExercise.save();
    res.status(201).json({ message: "Exercice de Bac ajouté avec succès", exercise: savedExercise });
  } catch (error) {
    console.error("Erreur lors de la création de l'exercice Bac:", error);
    res.status(500).json({ message: "Erreur lors de la création de l'exercice." });
  }
};

/**
 * 4️⃣ PHASE 4 : Analyser la photo de la copie et corriger avec GPT-4o (Vision)
 */
export const correctStudentCopy = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!openai) {
      res.status(503).json({ message: "Le service de correction IA est temporairement indisponible." });
      return;
    }
    
    const imageFile = req.file;
    const { exerciseId } = req.body;

    if (!imageFile || !exerciseId) {
      res.status(400).json({ message: "Image ou ID de l'exercice manquant." });
      return;
    }

    const exercise = await BacExam.findById(exerciseId);
    if (!exercise) {
      res.status(404).json({ message: "Exercice introuvable dans la base de données." });
      return;
    }

    const base64Image = imageFile.buffer.toString("base64");
    const mimeType = imageFile.mimetype || "image/jpeg";
    const dataURI = `data:${mimeType};base64,${base64Image}`;

    const corrigeOfficiel = exercise.indices?.niveau3_corrige || "Corrigé non disponible";
    const grilleBareme = JSON.stringify(exercise.checklist?.map((c: any) => ({ critere: c.description, points: c.points })) || []);

    const systemPrompt = `Tu es un professeur de Sciences Physiques ultra-compétent, correcteur officiel du Baccalauréat. 
Ta mission est d'analyser la photo de la copie manuscrite d'un étudiant et de la corriger de manière stricte.

CONTEXTE DE L'EXERCICE :
- Énoncé : ${exercise.enonceTexte}
- Corrigé officiel attendu : ${corrigeOfficiel}
- Grille d'évaluation (Barème) : ${grilleBareme}

INSTRUCTIONS DE CORRECTION :
1. Analyse la démarche sur l'image.
2. Validation des étapes : Évalue chaque critère de la Grille d'évaluation.
3. Détection des erreurs de rigueur (unités, flèches de vecteurs, etc.).
4. Notation : Additionne uniquement les points des critères validés.

RÈGLE VITALE : 
Tu dois IMPÉRATIVEMENT répondre avec un objet JSON strict correspondant à cette structure :
{
  "noteAttribuee": 0.0,
  "noteMaximale": 0.0,
  "validationEtapes": [
    {
      "critere": "Description",
      "valide": true,
      "pointsObtenus": 0.0,
      "explication": "Pourquoi"
    }
  ],
  "erreursRigueur": ["Erreur 1"],
  "feedbackGlobal": "Bilan"
}`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Voici la photo de ma copie. Peux-tu la corriger selon le barème ?" },
            { type: "image_url", image_url: { url: dataURI, detail: "high" } }
          ],
        },
      ],
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide de l'IA.");

    const firstBrace = responseContent.indexOf('{');
    const lastBrace = responseContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("L'IA n'a pas renvoyé de JSON valide.");
    
    const rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);
    const repairedJson = jsonrepair(rawJsonStr);
    const correctionReport = JSON.parse(repairedJson);

    res.status(200).json({
      message: "Correction effectuée avec succès.",
      report: correctionReport
    });

  } catch (error) {
    console.error("Erreur lors de la correction par l'IA :", error);
    res.status(500).json({ 
      message: "Erreur lors de l'analyse de la copie.", 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    });
  }
};

/**
 * 5️⃣ Récupérer une épreuve complète groupée par exercice
 */
export const getCompleteExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matiere, annee, session } = req.query;
    const query: Record<string, any> = {};
    
    if (matiere) query.matiere = { $regex: new RegExp(`^${matiere}$`, "i") };
    if (annee) query.annee = Number(annee);
    if (session) query.session = session;

    const questions = await BacExam.find(query).sort({ createdAt: 1 });

    if (questions.length === 0) {
      res.status(404).json({ message: "Aucune épreuve trouvée pour ces critères." });
      return;
    }

    console.log("bacController")

    const epreuveGroupee = questions.reduce((acc: any[], question) => {
      let exerciceBlock = acc.find(ex => ex.titre === question.numeroExercice);

      if (!exerciceBlock) {
        exerciceBlock = {
          titre: question.numeroExercice,
          questions: []
        };
        acc.push(exerciceBlock);
      }

      exerciceBlock.questions.push({
        id: question._id,
        numeroExercice: question.numeroExercice,
        label: question.labelQuestion,
        enonce: question.enonceTexte,
        image: question.imageUrl,
        indices: question.indices,
        checklist: question.checklist,
        Type: question.Type,
        type: question.type,
        theme: question.theme // 👈 Ajout du thème de l'exercice
      });

      return acc;
    }, []);

    res.status(200).json(epreuveGroupee);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'épreuve complète :", error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'épreuve." });
  }
};