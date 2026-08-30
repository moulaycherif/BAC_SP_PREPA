import React from 'react';
import { BacExercise } from '../../services/bacService';
// 👇 Import des outils de rendu Markdown et LaTeX
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Indispensable pour le style des maths

interface Props {
  exercise: BacExercise;
}

console.log("Left (BacSimulator)")

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
        
        {exercise.imageUrl && (
          <div className="mb-8 flex justify-center">
            <img 
              src={exercise.imageUrl} 
              alt="Illustration de l'exercice" 
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
            />
          </div>
        )}

        {/* 👇 Le nouveau moteur de rendu pour l'énoncé */}
        <div className="leading-relaxed text-justify text-gray-800 text-lg">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
            className="prose prose-blue max-w-none"
          >
            {exercise.enonceTexte}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel_Exam;