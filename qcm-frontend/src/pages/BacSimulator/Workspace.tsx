import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchExercises, BacExercise } from '../../services/bacService';

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface ExtendedBacExercise extends BacExercise {
  numeroExercice?: string;
  labelQuestion?: string;
  type?: string; 
  Type?: string; 
}

export default function BacSimulatorWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<ExtendedBacExercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const matiere = searchParams.get('matiere');
  const annee = searchParams.get('annee');
  const session = searchParams.get('session');
  const theme = searchParams.get('theme');

  useEffect(() => {
    const loadExercise = async () => {
      if (!matiere || !annee || !session || !theme) {
        setError("Critères de sélection manquants.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchExercises(matiere, annee, session, theme);
        setQuestions(data as ExtendedBacExercise[]);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l'épreuve.");
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [matiere, annee, session, theme]);

  const groupedByExercise = useMemo(() => {
    const groups: Record<string, ExtendedBacExercise[]> = {};
    questions.forEach((q) => {
      const exNum = q.numeroExercice?.trim() || "EXERCICE 1";
      if (!groups[exNum]) {
        groups[exNum] = [];
      }
      groups[exNum].push(q);
    });
    return groups;
  }, [questions]);

  const processExerciseQuestions = (exerciseQuestions: ExtendedBacExercise[]) => {
    let lastPreamble = "";

    return exerciseQuestions.map((q) => {
      const isGroup = String(q.type || q.Type || '').toUpperCase().trim() === 'GROUP';
      const parts = q.enonceTexte ? q.enonceTexte.split('**Question :**') : [];
      const cleanText = parts.length > 1 ? parts[1].trim() : (q.enonceTexte || '').trim();

      const match = cleanText.match(/^(.*?)(?:\s+|^)([a-z]\)\s+.*)$/is);
      let preamble = "";
      let subQuestion = cleanText;

      if (match) {
        preamble = match[1].replace(/\s+/g, ' ').trim(); 
        subQuestion = match[2].trim();
      }

      const groupText = (q.enonceTexte || '')
        .replace(/\*\*Contexte :\*\*/gi, '')
        .replace(/\*\*Question :\*\*/gi, '')
        .trim();

      let displayPreamble: string | null = match && !isGroup ? preamble : null;

      // Nettoyage des préambules en double à la volée
      if (!isGroup) {
        if (displayPreamble) {
          if (displayPreamble !== lastPreamble) {
            lastPreamble = displayPreamble;
          } else {
            displayPreamble = null;
          }
        } else {
          lastPreamble = "";
        }
      }

      return {
        ...q,
        isGroup,
        groupText,
        displayPreamble,
        displayQuestion: subQuestion,
        isSubQuestion: match !== null && !isGroup
      };
    });
  };

  const resolveImagePath = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    return `/images/${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-blue-600 font-bold animate-pulse">
        Chargement de l'épreuve...
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-600 font-bold text-xl mb-4">{error || "Aucun exercice trouvé pour ces critères."}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-800 transition flex items-center gap-2">
            <span>🔙</span> Quitter
          </button>
          <div className="text-center flex-1 mx-4">
            <h1 className="text-2xl font-extrabold text-blue-900 uppercase tracking-wider">
              {matiere} — {annee} ({session})
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              Thème : <span className="text-blue-700">{theme}</span>
            </p>
          </div>
          <div className="w-24"></div>
        </div>

        {Object.entries(groupedByExercise).map(([exTitle, exQuestions]) => {
          const processedQuestions = processExerciseQuestions(exQuestions);
          
          let cleanContext = "";
          if (processedQuestions.length > 0 && !processedQuestions[0].isGroup) {
            const rawFirst = processedQuestions[0].enonceTexte || '';
            if (rawFirst.includes('**Question :**')) {
              cleanContext = rawFirst.split('**Question :**')[0].replace(/\*\*Contexte :\*\*/gi, '').trim();
            }
          }

          return (
            <section key={exTitle} className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8 space-y-6">
              
              <div className="border-b-2 border-blue-100 pb-4">
                <h2 className="text-2xl font-black text-blue-800 uppercase tracking-wide flex items-center gap-3">
                  <span className="bg-blue-800 text-white px-4 py-1.5 rounded-lg text-lg shadow-sm">
                    {exTitle}
                  </span>
                  {theme !== "Toute l'épreuve" && theme !== "toute-lepreuve" && (
                    <span className="text-lg font-medium text-gray-600">— {theme}</span>
                  )}
                </h2>
              </div>

              {cleanContext && (
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-6">
                  <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    <Latex>{cleanContext}</Latex>
                  </div>
                </div>
              )}

              <div className="space-y-6 pt-2">
                {processedQuestions.map((q) => {
                  
                  if (q.isGroup) {
                    return (
                      <div key={q._id} className="mt-10 mb-4 bg-blue-50/70 p-5 rounded-xl border-l-4 border-l-blue-600 shadow-sm">
                        {q.labelQuestion && (
                          <h3 className="text-xl font-extrabold text-blue-900 mb-2">
                            <Latex>{q.labelQuestion}</Latex>
                          </h3>
                        )}
                        {q.groupText && (
                          <div className="text-lg text-gray-800 font-medium whitespace-pre-wrap">
                            <Latex>{q.groupText}</Latex>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={q._id} className="flex flex-col">
                      {q.displayPreamble && (
                        <div className="mb-3 mt-2 text-lg font-bold text-gray-900 ml-1">
                          <Latex>{q.displayPreamble}</Latex>
                        </div>
                      )}

                      <div className={`bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-6 transition-all ${
                        q.isSubQuestion ? 'ml-0 md:ml-6 border-l-4 border-l-blue-500' : ''
                      }`}>
                        <div className="flex-1">
                          
                          {q.imageUrl && (
                            <img 
                              src={resolveImagePath(q.imageUrl)} 
                              alt="Illustration de la question" 
                              className="mb-4 max-h-64 object-contain rounded border border-gray-200 shadow-sm bg-white p-2" 
                            />
                          )}
                          
                          <div className="inline text-gray-800 font-medium text-lg whitespace-pre-wrap">
                            <Latex>{q.displayQuestion}</Latex>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[140px] border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 justify-center">
                          <button className="w-full py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-2 text-sm">
                            <span>💡</span> Indice
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </section>
          );
        })}
      </div>
    </div>
  );
}