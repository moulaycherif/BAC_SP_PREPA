import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchExercises, BacExercise } from '../../services/bacService';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

export default function BacSimulatorWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<BacExercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const annee = searchParams.get('annee');
  const session = searchParams.get('session');
  const theme = searchParams.get('theme');

  useEffect(() => {
    const loadExercise = async () => {
      if (!annee || !session || !theme) {
        setError("Critères de sélection manquants.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchExercises(annee, session, theme);
        setQuestions(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'épreuve.");
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [annee, session, theme]);

  // 🧠 LOGIQUE DE REGROUPEMENT DES SOUS-QUESTIONS (a, b, c...)
  const groupedQuestions = useMemo(() => {
    let lastPreamble = "";

    return questions.map((q) => {
      // 1. Enlever la balise "**Question :**"
      const parts = q.enonceTexte.split('**Question :**');
      const cleanText = parts.length > 1 ? parts[1].trim() : q.enonceTexte.trim();

      // 2. Regex pour séparer "3) La donnée..." de "a) La question..."
      // Cherche le modèle : " a) ", " b) ", etc.
      const match = cleanText.match(/^(.*?)(?:\s+|^)([a-z]\)\s+.*)$/is);
      
      let preamble = "";
      let subQuestion = cleanText;

      if (match) {
        // On normalise les espaces pour éviter les faux-positifs dus aux erreurs de frappe
        preamble = match[1].replace(/\s+/g, ' ').trim(); 
        subQuestion = match[2].trim();
      }

      // 3. Vérifier si on doit afficher le préambule (seulement s'il est nouveau)
      const isNewPreamble = preamble !== "" && preamble !== lastPreamble;
      
      if (preamble !== "") {
        lastPreamble = preamble;
      } else {
        lastPreamble = ""; // Si question directe (sans a, b, c) on réinitialise
      }

      return {
        ...q,
        displayPreamble: isNewPreamble ? preamble : null,
        displayQuestion: subQuestion,
        isSubQuestion: match !== null // Permet d'indenter visuellement les a,b,c
      };
    });
  }, [questions]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-blue-600 font-bold animate-pulse">Chargement de l'exercice...</div>;
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-600 font-bold text-xl mb-4">{error || "Aucun exercice trouvé pour ces critères."}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-700 text-white rounded-lg">Retour</button>
      </div>
    );
  }

  // 🧠 LOGIQUE D'EXTRACTION DU CONTEXTE GLOBAL
  const rawFirstStatement = questions[0].enonceTexte;
  const contextPart = rawFirstStatement.split('**Question :**')[0];
  const cleanContext = contextPart.replace(/\*\*Contexte :\*\*/gi, '').trim();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-bold rounded hover:bg-gray-400 transition"
          >
            🔙 Quitter
          </button>
          <h1 className="text-2xl font-extrabold text-blue-800 uppercase tracking-wider text-center flex-1">
            EXERCICE : {theme} <br/> <span className="text-lg text-gray-600">({annee} - {session})</span>
          </h1>
          <div className="w-24"></div>
        </div>

        {/* 📖 BLOC DU CONTEXTE GLOBAL */}
        {cleanContext && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              <Latex>{cleanContext}</Latex>
            </div>
          </div>
        )}

        {/* 📝 LISTE DES QUESTIONS */}
        <div className="space-y-6">
          {groupedQuestions.map((q) => (
            <div key={q._id} className="flex flex-col">
              
              {/* PRÉAMBULE (Affiché une seule fois pour a, b, c) */}
              {q.displayPreamble && (
                <div className="mb-4 mt-2 text-lg font-bold text-gray-900 ml-2">
                  <Latex>{q.displayPreamble}</Latex>
                </div>
              )}

              {/* CARTE DE LA QUESTION (a, b, c...) */}
              <div 
                className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 transition-all ${
                  q.isSubQuestion 
                    ? 'ml-0 md:ml-8 border-l-4 border-l-blue-500' // 👈 Indentation et bordure bleue pour a, b, c
                    : ''
                }`}
              >
                
                {/* Section Texte Question */}
                <div className="flex-1">
                  {q.imageUrl && (
                    <img 
                      src={q.imageUrl} 
                      alt="Illustration" 
                      className="mb-4 max-h-64 object-contain rounded border border-gray-200" 
                    />
                  )}
                  <div className="text-gray-800 font-medium text-lg whitespace-pre-wrap">
                    <Latex>{q.displayQuestion}</Latex>
                  </div>
                </div>

                {/* Section Actions (Boutons) */}
                <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 justify-center">
                  <button className="w-full py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded transition shadow-sm">
                    💡 Indice
                  </button>
                  <button className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded transition shadow-sm">
                    📸 Scanner réponse
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}