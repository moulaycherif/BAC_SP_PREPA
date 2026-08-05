import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchExercises, BacExercise } from '../../services/bacService';

// 🚀 IMPORTS POUR LE RENDU LATEX
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

  // 🧠 LOGIQUE D'EXTRACTION DU CONTEXTE
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
          <h1 className="text-2xl font-extrabold text-blue-800 uppercase tracking-wider">
            EXERCICE : {theme} ({annee} - {session})
          </h1>
          <div className="w-24"></div>
        </div>

        {/* 📖 BLOC DU CONTEXTE GLOBAL */}
        {cleanContext && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              {/* On enveloppe le texte avec <Latex> pour transformer les $...$ */}
              <Latex>{cleanContext}</Latex>
            </div>
          </div>
        )}

        {/* 📝 LISTE DES QUESTIONS */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const parts = q.enonceTexte.split('**Question :**');
            const cleanQuestion = parts.length > 1 ? parts[1].trim() : q.enonceTexte.trim();

            return (
              <div key={q._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                
                {/* Section Question */}
                <div className="flex-1">
                  {q.imageUrl && (
                    <img 
                      src={q.imageUrl} 
                      alt="Illustration de la question" 
                      className="mb-4 max-h-64 object-contain rounded border border-gray-200" 
                    />
                  )}
                  <div className="text-gray-900 font-semibold text-lg whitespace-pre-wrap">
                    {/* On enveloppe la question avec <Latex> */}
                    <Latex>{cleanQuestion}</Latex>
                  </div>
                </div>

                {/* Section Actions */}
                <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 justify-center">
                  <button className="w-full py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded transition">
                    💡 Demander un Indice
                  </button>
                  <button className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded transition">
                    📸 Scanner ma réponse
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}