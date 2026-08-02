import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DualPanelLayout from '../../components/BacSimulator/DualPanelLayout';
import { fetchExercises, BacExercise } from '../../services/bacService';

export default function BacSimulatorWorkspace() {
  const [searchParams] = useSearchParams();
  const [exercise, setExercise] = useState<BacExercise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      {/* On passe les données de l'exercice au Layout qui va les redistribuer */}
      <DualPanelLayout exercise={exercise} />
    </div>
  );
}