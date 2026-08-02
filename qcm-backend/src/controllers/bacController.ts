import { Request, Response } from "express";
import BacExam from "../models/BacExam";
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";

/**
 * 1️⃣ Obtenir les filtres disponibles (Années, Sessions, Thèmes)
 * Utile pour peupler dynamiquement la page d'accueil du BAC SIMULATOR.
 */
export const getFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    // On demande à MongoDB de nous lister toutes les valeurs uniques pour chaque champ
    const years = await BacExam.distinct("annee");
    const sessions = await BacExam.distinct("session");
    const themes = await BacExam.distinct("theme");

    // On trie les années par ordre décroissant (le plus récent en premier)
    const sortedYears = years.sort((a, b) => b - a);

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
 * Appelé quand l'étudiant clique sur "Commencer l'épreuve".
 */
export const getExercisesByFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { annee, session, theme } = req.query;

    // Construction dynamique du filtre de recherche
    const query: any = {};
    if (annee) query.annee = Number(annee);
    if (session) query.session = session;
    if (theme) query.theme = theme;

    // On cherche les exercices correspondants
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
 * 3️⃣ (Optionnel pour le moment) Ajouter un nouvel exercice Bac depuis le panneau Admin
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
// Initialisation du client OpenAI (Assurez-vous d'utiliser une clé valide dans .env)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 4️⃣ PHASE 4 : Analyser la photo de la copie et corriger avec GPT-4o (Vision)
 */
export const correctStudentCopy = async (req: Request, res: Response): Promise<void> => {
  try {
    const imageFile = req.file;
    const { exerciseId } = req.body;

    if (!imageFile) {
      res.status(400).json({ message: "Aucune image de copie fournie." });
      return;
    }

    if (!exerciseId) {
      res.status(400).json({ message: "L'ID de l'exercice est manquant." });
      return;
    }

    // 1. Récupération du contexte de l'exercice dans la BDD
    const exercise = await BacExam.findById(exerciseId);
    if (!exercise) {
      res.status(404).json({ message: "Exercice introuvable dans la base de données." });
      return;
    }

    // 2. Conversion de l'image Buffer en Base64 pour l'API Vision
    const base64Image = imageFile.buffer.toString("base64");
    const mimeType = imageFile.mimetype || "image/jpeg";
    const dataURI = `data:${mimeType};base64,${base64Image}`;

    // 3. Préparation des données pour le Prompt
    const corrigeOfficiel = exercise.indices.niveau3_corrige;
    const grilleBareme = JSON.stringify(exercise.checklist.map(c => ({ critere: c.description, points: c.points })));

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

    // 4. Appel à GPT-4o (Modèle multimodal)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2, // Température basse pour une correction factuelle et constante
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
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

    // 5. Nettoyage et Parse du JSON
    const firstBrace = responseContent.indexOf('{');
    const lastBrace = responseContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error("L'IA n'a pas renvoyé de JSON valide.");
    
    const rawJsonStr = responseContent.substring(firstBrace, lastBrace + 1);
    const repairedJson = jsonrepair(rawJsonStr);
    const correctionReport = JSON.parse(repairedJson);

    // 6. Renvoi du rapport d'évaluation au Frontend
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