import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { API_BASE_URL } from '../config';
import StudentCorrection from '../components/StudentCorrection';

// Nouvelle interface adaptée à l'import Excel
interface Question {
  _id: string;
  subSubject?: string;
  theme?: string;
  exerciseTitle: string;
  questionNumber?: string;
  statement: string;
  imageUrl?: string;
  hints?: string[];
}

const BacSimulator: React.FC = () => {
  // 1. Récupération des paramètres depuis l'URL
  const { subject, year, session, theme } = useParams<{ subject: string; year: string; session: string; theme: string }>();
  const navigate = useNavigate();

  // 2. Déclarer le tableau de questions dans le state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamData = async () => {
      setLoading(true);
      try {
        // Transmission des paramètres au backend
        const response = await axios.get(`${API_BASE_URL}/api/exams`, {
          params: { subject, year, session, theme }
        });

        // Filtrage côté client si le backend renvoie tout par défaut
        let data: Question[] = response.data;
        if (theme && theme !== "toute-lepreuve") {
          data = data.filter(q => q.theme?.toLowerCase() === theme.toLowerCase());
        }

        setQuestions(data);
      } catch (error) {
        console.error("Erreur lors du chargement de l'examen :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [subject, year, session, theme]);

  // 3. Regroupement des questions par Titre d'exercice (ex: "EXERCICE 1")
  const groupedExercises = questions.reduce((acc, q) => {
    const key = q.exerciseTitle || "Exercice Général";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  // Écran de chargement
  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-semibold text-lg">Chargement de l'épreuve...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Bouton de retour */}
      <button 
        onClick={() => navigate(-1)} 
        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold shadow-md flex items-center gap-2 w-fit"
      >
        <span>🔙</span> Retour
      </button>

      {/* En-tête de l'épreuve */}
      <header className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold uppercase">
          Examen National {year} — Session {session}
        </h1>
        <p className="text-indigo-200 mt-2 text-lg font-medium">
          Discipline : {subject?.toUpperCase()} | Mode : {theme === 'toute-lepreuve' ? "🏆 Épreuve Complète" : theme}
        </p>
      </header>

      {/* Affichage conditionnel s'il n'y a aucune donnée */}
      {questions.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-600 text-lg">
          Aucun exercice trouvé pour ces critères.
        </div>
      ) : (
        /* Rendu bloc par bloc de chaque exercice groupé */
        Object.entries(groupedExercises).map(([title, items]) => (
          <section key={title} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 space-y-6">
            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-3">
              {title}
            </h2>

            {items.map((q) => (
              <div key={q._id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-start gap-3">
                  {q.questionNumber && (
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shrink-0 mt-1">
                      {q.questionNumber}
                    </span>
                  )}
                  <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                    {q.statement}
                  </div>
                </div>

                {q.imageUrl && (
                  <img src={q.imageUrl} alt="Schéma de l'exercice" className="max-w-md rounded-lg shadow border my-3" />
                )}

                {/* Module de réponse étudiant + Indices IA */}
                <StudentCorrection exerciseId={q._id} hints={q.hints || []} />
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
};

export default BacSimulator;