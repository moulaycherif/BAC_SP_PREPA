import React, { useState } from 'react';
import { BacExercise } from '../../services/bacService';

interface Props {
  exercise: BacExercise;
}

const RightPanel_Dashboard: React.FC<Props> = ({ exercise }) => {
  // État pour le Scaffolding (Phase 2)
  const [helpLevel, setHelpLevel] = useState<number>(0);
  
  // États pour l'Auto-évaluation (Phase 3 & 4)
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [correctionMode, setCorrectionMode] = useState<'checklist' | 'ia' | null>(null);
  
  // État pour le calcul du score (Checklist)
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(exercise.checklist.length).fill(false));

  const handleHelpClick = () => {
    if (helpLevel < 3) setHelpLevel(helpLevel + 1);
  };

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  // Calcul dynamique du score
  const scoreObtenu = exercise.checklist.reduce((total, critere, index) => {
    return total + (checkedItems[index] ? critere.points : 0);
  }, 0);
  const scoreMax = exercise.checklist.reduce((total, critere) => total + critere.points, 0);

  return (
    <div className="p-8 flex flex-col h-full bg-gray-50">
      
      {/* --- EN TÊTE --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Espace de Travail</h2>
        <p className="text-sm text-gray-500">Rédige sur ton cahier, puis valide ton travail.</p>
      </div>

      {!isFinished ? (
        /* =========================================================
           PHASE 2 : SYSTÈME D'AIDE PROGRESSIF (SCAFFOLDING)
           ========================================================= */
        <div className="flex-grow flex flex-col justify-between">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">💡 Système d'Indice</h3>
            
            <div className="space-y-3">
              {helpLevel >= 1 && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                  <strong>Piste réflexive :</strong> {exercise.indices.niveau1_piste}
                </div>
              )}
              {helpLevel >= 2 && (
                <div className="p-3 bg-orange-50 border-l-4 border-orange-400 text-orange-800 rounded">
                  <strong>Outil / Formule :</strong> {exercise.indices.niveau2_formule}
                </div>
              )}
              {helpLevel >= 3 && (
                <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-800 rounded">
                  <strong>Corrigé détaillé :</strong> {exercise.indices.niveau3_corrige}
                </div>
              )}

              {helpLevel < 3 && (
                <button 
                  onClick={handleHelpClick}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition"
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
        /* =========================================================
           PHASE 3 & 4 : AUTO-ÉVALUATION ET CORRECTION
           ========================================================= */
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
            /* --- PHASE 3 : LA CHECKLIST --- */
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
                      <span className="text-gray-800 block">{critere.description}</span>
                      <span className="text-xs font-bold text-green-600">+{critere.points} pt</span>
                    </div>
                  </label>
                ))}
              </div>

              <button 
                onClick={() => alert("Résultat enregistré dans tes statistiques ! (À relier au backend)")}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition"
              >
                💾 Enregistrer mon score
              </button>
            </div>
          ) : (
            /* --- PHASE 4 : UPLOAD IA (En attente d'implémentation UI) --- */
            <div className="text-center p-6">
              <h3 className="font-bold text-lg mb-4">Scanner avec l'IA</h3>
              <input type="file" accept="image/*" className="mb-4" />
              <p className="text-sm text-gray-500">Ici viendra la logique pour envoyer la photo vers /api/bac/correct.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightPanel_Dashboard;