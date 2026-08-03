import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DualPanelLayout from '../../components/BacSimulator/DualPanelLayout';
import { fetchExercises, BacExercise } from '../../services/bacService';
import { useNavigate } from 'react-router-dom';

export default function BacSimulatorWorkspace() {
  const [searchParams] = useSearchParams();
  const [exercise, setExercise] = useState<BacExercise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadExercise = async () => {
      try {
        const annee = searchParams.get('annee') || '';
        const session = searchParams.get('session') || '';
        const theme = searchParams.get('theme') || '';

        // Appel API vers notre backend
        const exercises = await fetchExercises(annee, session, theme);
        if (exercises && exercises.length > 0) {
          setExercise(exercises[0]); // On prend le premier exercice correspondant
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'exercice :", error);
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [searchParams]);

  if (loading) return <div className="p-10 text-center font-bold">Chargement de l'épreuve...</div>;
  if (!exercise) return <div className="p-10 text-center text-red-500 font-bold">Aucun exercice trouvé.</div>;

  return (
    <div className="h-[calc(100vh-64px)] w-full"> 
     {/* 👇 LE BOUTON DE RETOUR À AJOUTER EN HAUT DE PAGE */}
      <button
        onClick={() => navigate(-1)} // "-1" permet de revenir à la page précédente dans l'historique
        className="mb-6 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition z-10 font-semibold shadow-md flex items-center gap-2 w-fit"
      >
        <span>🔙</span> Retour
      </button>
      {/* On passe les données de l'exercice au Layout qui va les redistribuer */}
      <DualPanelLayout exercise={exercise} />
    </div>
  );
}