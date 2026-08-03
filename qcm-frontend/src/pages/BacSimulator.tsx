import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentCorrection from '../components/StudentCorrection';
import axios from "../api/axios";
import { API_BASE_URL } from "../config";

// Interface pour typer correctement l'exercice
interface Exercice {
  _id: string;
  titreExercice: string;
  enonceTexte: string;
  imageUrl?: string;
  theme?: string;
}

const BacSimulator: React.FC = () => {
  // 1. Récupération de 'theme' depuis l'URL
  const { subject, year, session, theme } = useParams<{ subject: string; year: string; session: string; theme: string }>();
  const navigate = useNavigate();

  // 2. Déclarer le tableau d'exercices dans le state
  const [exercises, setExercises] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamData = async () => {
      setLoading(true);
      try {
        // Adaptation du filtre : transmettre theme à votre backend
        const response = await axios.get(`${API_BASE_URL}/api/exams`, {
          params: { subject, year, session, theme }
        });

        // Si l'API renvoie tous les exercices et que le filtrage se fait côté client :
        let data: Exercice[] = response.data;
        if (theme && theme !== "toute-lepreuve") {
          data = data.filter(ex => ex.theme?.toLowerCase() === theme);
        }

        setExercises(data);
      } catch (error) {
        console.error("Erreur lors du chargement des exercices :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [subject, year, session, theme]);

  if (loading) return <div className="p-8 text-center text-gray-600 font-semibold">Chargement de l'examen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Bouton de retour */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-semibold shadow-md flex items-center gap-2"
      >
        <span>🔙</span> Retour
      </button>

      <header className="mb-8 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-900">
          Examen National : {subject?.toUpperCase()} - {year} ({session})
        </h2>
        <p className="text-indigo-700 mt-1 font-medium">
          Thème : {theme === "toute-lepreuve" ? "🏆 Toute l'épreuve" : theme}
        </p>
      </header>

      {/* Affichage de la liste des exercices */}
      {exercises.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl border">
          Aucun exercice trouvé pour ces critères.
        </div>
      ) : (
        exercises.map((exercice) => (
          <div key={exercice._id} className="mb-12 bg-white p-6 rounded-xl shadow border border-gray-100">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{exercice.titreExercice}</h2>
            <p className="mb-6 whitespace-pre-wrap text-gray-700">{exercice.enonceTexte}</p>
            
            {exercice.imageUrl && (
              <img src={exercice.imageUrl} alt="Schéma" className="mb-6 max-w-full rounded-lg shadow-sm" />
            )}

            <StudentCorrection exerciseId={exercice._id} />
          </div>
        ))
      )}
    </div>
  );
};

export default BacSimulator;