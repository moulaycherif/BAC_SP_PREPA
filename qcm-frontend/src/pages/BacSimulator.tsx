import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StudentCorrection from '../components/StudentCorrection';
// Import de votre parseur si nécessaire, ex: import MixedContentRenderer from '../components/MixedContentRenderer';
import axios from "../api/axios";
import { API_BASE_URL } from "../config";

const BacSimulator : React.FC = () => {
  // Récupération des paramètres depuis l'URL
  const { subject, year, session } = useParams();
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Logique pour fetch l'énoncé de l'examen depuis votre backend
    // axios.get(`/api/exams/${subject}/${year}/${session}`).then(...)
   // ... logique pour récupérer les exercices du BAC via votre API (getExercisesByFilters)
  }, [subject, year, session]);

  if (loading) return <div>Chargement de l'examen...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h2>Examen National : {subject} - {year} ({session})</h2>
      </header>

     {/* Affichage de la liste des exercices ou d'un exercice spécifique */}
      {exercises.map((exercice) => (
        <div key={exercice._id} className="mb-12 bg-white p-6 rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-4">{exercice.titreExercice}</h2>
          <p className="mb-6 whitespace-pre-wrap">{exercice.enonceTexte}</p>
          
          {exercice.imageUrl && (
            <img src={exercice.imageUrl} alt="Schéma" className="mb-6 max-w-full rounded-lg" />
          )}

          {/* 👈 C'EST ICI QUE VOUS INTÉGREZ LE FORMULAIRE DE CORRECTION */}
          <StudentCorrection exerciseId={exercice._id} />
        </div>
      ))}
    </div>
  );
};

export default BacSimulator;