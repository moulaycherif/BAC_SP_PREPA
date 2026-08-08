import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { API_BASE_URL } from '../config';
import RightPanel_Dashboard from '../components/RightPanel_Dashboard';

// 1️⃣ L'interface est alignée sur ta nouvelle base de données
interface Question {
  _id: string;
  matiere?: string;
  theme?: string;
  numeroExercice: string; 
  labelQuestion: string;  
  enonceTexte: string;    
  imageUrl?: string;
  indices?: any;
  checklist: any[]; 
}

const BacSimulator: React.FC = () => {
  const { subject, year, session, theme } = useParams<{ subject: string; year: string; session: string; theme: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exams`, {
          params: { subject, year, session, theme } // Le backend gère tout le filtrage
        });

        // 2️⃣ NOUVEAU : On donne directement les données au state sans les re-filtrer !
        setQuestions(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement de l'examen :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [subject, year, session, theme]);

  // 3️⃣ Regroupement par exercice (utilise bien "numeroExercice")
  const groupedExercises = questions.reduce((acc, q) => {
    const key = q.numeroExercice || "Exercice Général"; 
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Chargement de l'épreuve...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <button 
        onClick={() => navigate(-1)} 
        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold shadow-md flex items-center gap-2 w-fit"
      >
        <span>🔙</span> Retour
      </button>

      <header className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold uppercase">
          Examen National {year} — Session {session}
        </h1>
        <p className="text-indigo-200 mt-2 text-lg font-medium">
          Discipline : {subject?.toUpperCase()} | Mode : {theme === 'toute-lepreuve' ? "🏆 Épreuve Complète" : theme}
        </p>
      </header>

      {questions.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 text-lg">
          Aucun exercice trouvé pour ces critères.
        </div>
      ) : (
        Object.entries(groupedExercises).map(([title, items]) => (
          <section key={title} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-3">
              {title} {/* 🎯 Affichera "EXERCICE 1" */}
            </h2>

            {items.map((q) => (
              <div key={q._id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-start gap-3">
                  
                  {/* 🎯 Affichera "1) a)" */}
                  {q.labelQuestion && q.labelQuestion !== "Question globale" && (
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shrink-0 mt-1">
                      {q.labelQuestion}
                    </span>
                  )}
                  
                  {/* 🎯 Affichera l'énoncé */}
                  <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {q.enonceTexte}
                  </div>
                </div>

                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Schéma de l'exercice" className="max-w-md rounded-lg shadow border my-3" />
                )}

                {/* 🎯 On passe l'objet complet "q" au panneau RightPanel_Dashboard */}
                <RightPanel_Dashboard exercise={q as any} />
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
};

export default BacSimulator;