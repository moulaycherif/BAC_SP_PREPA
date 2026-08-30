// Définition des interfaces pour typer le retour de l'IA
export interface IAiResponse {
  indices: {
    niveau1_piste: string;
    niveau2_formule: string;
    niveau3_corrige: string;
  };
  checklist: Array<{
    description: string;
    points: number;
  }>;
}

console.log("aiService (services - back)")

/**
 * Envoie l'énoncé à l'IA via OpenRouter et récupère les indices et la checklist au format JSON.
 * @param statement L'énoncé complet de la question.
 * @returns Un objet contenant les indices (scaffolding) et la checklist de correction.
 */
export async function generateSolutionAndHints(statement: string): Promise<IAiResponse> {
  const prompt = `
  Tu es un professeur expert en Mathématiques et Sciences Physiques (Niveau Baccalauréat).
  Voici l'énoncé complet d'une question d'examen :
  "${statement}"

  Ta mission est double :
  1. Générer 3 niveaux d'aide progressifs (Scaffolding) pour guider l'élève :
     - niveau1_piste : Un indice conceptuel ou une piste réflexive.
     - niveau2_formule : L'indice calculatoire ou la loi/formule à utiliser.
     - niveau3_corrige : Une rédaction partielle, détaillée et rigoureuse (utilise le format Markdown et le format LaTeX pour les mathématiques avec $ pour l'inline et $$ pour les blocs).
  2. Créer une checklist de correction détaillée. Découpe la résolution en étapes clés avec un barème associé.

  Renvoie UNIQUEMENT un objet JSON valide avec cette structure exacte, sans aucun texte introductif ou markdown de bloc de code :
  {
    "indices": {
      "niveau1_piste": "texte...",
      "niveau2_formule": "texte...",
      "niveau3_corrige": "texte avec $LaTeX$..."
    },
    "checklist": [
      { "description": "Avoir appliqué la bonne formule", "points": 0.5 },
      { "description": "Calcul exact avec les bonnes unités", "points": 0.5 }
    ]
  }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Modèle recommandé pour la résolution mathématique et le respect strict du JSON
        model: "openai/gpt-4o", // ou "anthropic/claude-3.5-sonnet"
        messages: [{ role: "user", content: prompt }],
        // Force l'API à renvoyer un JSON valide (très bien supporté par les modèles OpenAI)
        response_format: { type: "json_object" } 
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur API OpenRouter: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parsing strict pour correspondre à notre interface
    const parsedData = JSON.parse(content) as IAiResponse;
    return parsedData;

  } catch (err) {
    console.error("Erreur de génération IA :", err);
    
    // Retourne un objet par défaut (Mock) en cas d'échec pour ne pas faire planter l'importation Excel
    return {
      indices: {
        niveau1_piste: "Relisez attentivement l'énoncé et identifiez les données clés.",
        niveau2_formule: "Cherchez la formule ou le théorème du cours qui relie ces données.",
        niveau3_corrige: "La solution détaillée n'a pas pu être générée suite à une erreur technique."
      },
      checklist: [
        { description: "Tentative de résolution de la question", points: 0 }
      ]
    };
  }
}