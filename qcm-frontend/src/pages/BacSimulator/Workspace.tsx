import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchExercises, BacExercise } from '../../services/bacService';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

// 💡 Assurez-vous que votre interface BacExercise dans bacService.ts correspond à ces champs
// export interface BacExercise {
//   _id: string;
//   type: string; // 'GROUP' ou 'QUESTION'
//   texteQuestion: string; // La colonne "Texte de la question"
//   subQuestion: string; // La colonne "sub_Question"
//   imageUrl?: string;
// }

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

  // 🧠 ISOLER LE CONTEXTE (Ligne de type 'GROUP')
  // On cherche la première ligne qui sert de contexte global à l'exercice
  const groupRow = questions.find(q => q.type === 'GROUP');
  const globalContext = groupRow ? groupRow.texteQuestion : null;

  // 📝 ISOLER LES QUESTIONS (On exclut la ligne GROUP)
  const exerciseQuestions = questions.filter(q => q.type !== 'GROUP');

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

        {/* 📖 BLOC DU CONTEXTE GLOBAL (Issu de la ligne GROUP) */}
        {globalContext && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              <Latex>{globalContext}</Latex>
            </div>
          </div>
        )}

        {/* 📝 LISTE DES QUESTIONS */}
        <div className="space-y-6">
          {exerciseQuestions.map((q) => (
            <div key={q._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                
              {/* Section Texte Question */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Illustration éventuelle */}
                {q.imageUrl && (
                  <img 
                    src={q.imageUrl} 
                    alt="Illustration" 
                    className="mb-4 max-h-64 object-contain rounded border border-gray-200 self-start" 
                  />
                )}
                
                {/* 1️⃣ Affichage de la "Donnée" (Texte de la question) */}
                {q.texteQuestion && q.texteQuestion.trim() !== "" && (
                  <div className="text-gray-900 font-bold text-lg whitespace-pre-wrap">
                    <Latex>{q.texteQuestion}</Latex>
                  </div>
                )}

                {/* 2️⃣ Affichage de la "Sous-question" (sub_Question) */}
                {q.subQuestion && q.subQuestion.trim() !== "" && (
                  <div className="text-gray-800 font-medium text-lg whitespace-pre-wrap ml-0 md:ml-6 border-l-4 border-blue-400 pl-4 py-1 bg-blue-50/50 rounded-r-lg">
                    <Latex>{q.subQuestion}</Latex>
                  </div>
                )}
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
          ))}
        </div>

      </div>
    </div>
  );
}