import React from 'react';
import { BacExercise } from '../../services/bacService';

interface Props {
  exercise: BacExercise;
}

const LeftPanel_Exam: React.FC<Props> = ({ exercise }) => {
  return (
    <div className="p-8">
      {/* En-tête de l'épreuve */}
      <div className="border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Baccalauréat Sciences Physiques</h1>
        <p className="text-gray-500 font-medium mt-1">
          Session {exercise.session} {exercise.annee} — Thème : {exercise.theme}
        </p>
      </div>

      {/* Contenu de l'énoncé */}
      <div className="prose max-w-none text-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-blue-900">{exercise.titreExercice}</h2>
        
        {/* Affichage de l'image (Circuit électrique, graphe, etc.) si elle existe */}
        {exercise.imageUrl && (
          <div className="mb-8 flex justify-center">
            <img 
              src={exercise.imageUrl} 
              alt="Illustration de l'exercice" 
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
            />
          </div>
        )}

        {/* 
          Affichage du texte de l'énoncé.
          La classe "whitespace-pre-wrap" permet de respecter les sauts de ligne tapés dans la base de données.
          (Pour interpréter le LaTeX à l'avenir, vous pourrez wrapper ceci avec un composant 'react-markdown' ou 'react-katex')
        */}
        <div className="whitespace-pre-wrap leading-relaxed text-justify text-gray-800 text-lg">
          {exercise.enonceTexte}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel_Exam;