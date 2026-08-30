import React, { useState } from 'react';
import { BacExercise } from '../../services/bacService';
import AiCorrectionScanner from './AiCorrectionScanner';
// 👇 Import des outils de rendu Markdown et LaTeX
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  exercise: BacExercise;
}

// 👇 Petit composant réutilisable pour éviter de répéter le code de rendu
const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="prose max-w-none text-sm mt-1">
    {content}
  </ReactMarkdown>
);

console.log("Right (BacSimulator)")

const RightPanel_Dashboard: React.FC<Props> = ({ exercise }) => {
  const [helpLevel, setHelpLevel] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [correctionMode, setCorrectionMode] = useState<'checklist' | 'ia' | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(exercise.checklist.length).fill(false));

  const handleHelpClick = () => {
    if (helpLevel < 3) setHelpLevel(helpLevel + 1);
  };

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const scoreObtenu = exercise.checklist.reduce((total, critere, index) => {
    return total + (checkedItems[index] ? critere.points : 0);
  }, 0);
  const scoreMax = exercise.checklist.reduce((total, critere) => total + critere.points, 0);

  return (
    <div className="p-8 flex flex-col h-full bg-gray-50">
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Espace de Travail</h2>
        <p className="text-sm text-gray-500">Rédige sur ton cahier, puis valide ton travail.</p>
      </div>

      {!isFinished ? (
        <div className="flex-grow flex flex-col justify-between">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">💡 Système d'Indice</h3>
            
            <div className="space-y-3">
              {helpLevel >= 1 && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded">
                  <strong className="text-yellow-900 block mb-1">Piste réflexive :</strong> 
                  <MarkdownRenderer content={exercise.indices.niveau1_piste} />
                </div>
              )}
              {helpLevel >= 2 && (
                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 text-orange-900 rounded">
                  <strong className="text-orange-900 block mb-1">Outil / Formule :</strong> 
                  <MarkdownRenderer content={exercise.indices.niveau2_formule} />
                </div>
              )}
              {helpLevel >= 3 && (
                <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-900 rounded">
                  <strong className="text-red-900 block mb-1">Corrigé détaillé :</strong> 
                  <MarkdownRenderer content={exercise.indices.niveau3_corrige} />
                </div>
              )}

              {helpLevel < 3 && (
                <button 
                  onClick={handleHelpClick}
                  className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition"
                >
                  Débloquer l'indice {helpLevel + 1}
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsFinished(true)}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow transition"
          >
            ✅ J'ai terminé ma rédaction
          </button>
        </div>
      ) : (
        /* PHASE 3 & 4 (Checklist & IA) restent identiques à votre code d'origine */
        <div className="flex-grow flex flex-col">
          {!correctionMode ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center mb-6">Comment veux-tu être corrigé ?</h3>
              <button 
                onClick={() => setCorrectionMode('checklist')}
                className="w-full p-4 bg-white border-2 border-blue-500 rounded-xl hover:bg-blue-50 transition text-left"
              >
                <span className="block font-bold text-blue-700 text-lg">📝 Auto-Correction (Checklist)</span>
                <span className="text-sm text-gray-600">Je compare ma copie avec la grille officielle et je m'évalue.</span>
              </button>
              
              <button 
                onClick={() => setCorrectionMode('ia')}
                className="w-full p-4 bg-white border-2 border-purple-500 rounded-xl hover:bg-purple-50 transition text-left"
              >
                <span className="block font-bold text-purple-700 text-lg">🤖 Scan & Correct IA</span>
                <span className="text-sm text-gray-600">Je prends ma copie en photo et l'IA m'évalue.</span>
              </button>
            </div>
          ) : correctionMode === 'checklist' ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="font-bold text-gray-800 text-lg">Grille Officielle</h3>
                <div className="text-xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded">
                  Score : {scoreObtenu} / {scoreMax}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Coche les étapes que tu as réussies sur ta feuille :</p>
              
              <div className="space-y-4">
                {exercise.checklist.map((critere, index) => (
                  <label key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-5 h-5 text-blue-600 rounded"
                      checked={checkedItems[index]}
                      onChange={() => handleCheck(index)}
                    />
                    <div className="flex-grow">
                      <span className="text-gray-800 block">
                        {/* Optionnel : Rendre aussi le markdown dans la checklist si l'IA y met des maths */}
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{critere.description}</ReactMarkdown>
                      </span>
                      <span className="text-xs font-bold text-green-600">+{critere.points} pt</span>
                    </div>
                  </label>
                ))}
              </div>

              <button 
                onClick={() => alert("Résultat enregistré ! (À relier au backend)")}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition"
              >
                💾 Enregistrer mon score
              </button>
            </div>
          ) : (
            <AiCorrectionScanner />
          )}
        </div>
      )}
    </div>
  );
};

export default RightPanel_Dashboard;