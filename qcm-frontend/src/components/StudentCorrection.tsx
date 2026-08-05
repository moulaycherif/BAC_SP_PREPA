import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // ⚠️ Indispensable pour l'affichage des formules

// --- INTERFACES ---
interface ChecklistItem {
  description: string;
  points: number;
}

interface StudentCorrectionProps {
  indices: {
    niveau1_piste: string;
    niveau2_formule: string;
    niveau3_corrige: string;
  };
  checklist: ChecklistItem[];
}

export default function StudentCorrection({ indices, checklist }: StudentCorrectionProps) {
  // --- ÉTATS ---
  // hintLevel : 0 = rien, 1 = piste, 2 = formule, 3 = corrigé
  const [hintLevel, setHintLevel] = useState<number>(0);
  
  // Tableau pour stocker l'index des cases cochées
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // --- GESTIONNAIRES ---
  const handleToggleCheck = (index: number) => {
    if (checkedItems.includes(index)) {
      setCheckedItems(checkedItems.filter((i) => i !== index));
    } else {
      setCheckedItems([...checkedItems, index]);
    }
  };

  const currentScore = checkedItems.reduce((total, index) => total + checklist[index].points, 0);
  const totalScore = checklist.reduce((total, item) => total + item.points, 0);

  // Composant réutilisable pour afficher le texte Markdown + LaTeX
  const MarkdownRenderer = ({ content }: { content: string }) => (
    <div className="prose prose-blue max-w-none mt-2">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mt-6">
      
      {/* 🧠 SECTION 1 : INDICES PROGRESSIFS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Besoin d'aide ?</h3>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setHintLevel(1)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hintLevel >= 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            1. Piste de réflexion
          </button>
          
          <button
            onClick={() => setHintLevel(2)}
            disabled={hintLevel < 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hintLevel >= 2 ? "bg-purple-600 text-white" : 
              hintLevel < 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            2. Formule / Loi
          </button>

          <button
            onClick={() => setHintLevel(3)}
            disabled={hintLevel < 2}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hintLevel === 3 ? "bg-green-600 text-white" : 
              hintLevel < 2 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            3. Voir la correction
          </button>
        </div>

        {/* Affichage conditionnel des indices */}
        <div className="space-y-4">
          {hintLevel >= 1 && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <span className="font-bold text-blue-800 uppercase text-sm">Indice 1</span>
              <MarkdownRenderer content={indices.niveau1_piste} />
            </div>
          )}

          {hintLevel >= 2 && (
            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
              <span className="font-bold text-purple-800 uppercase text-sm">Indice 2</span>
              <MarkdownRenderer content={indices.niveau2_formule} />
            </div>
          )}

          {hintLevel === 3 && (
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg mt-6">
              <span className="font-bold text-green-800 uppercase text-sm">Correction Détaillée</span>
              <MarkdownRenderer content={indices.niveau3_corrige} />
            </div>
          )}
        </div>
      </div>

      {/* ✅ SECTION 2 : CHECKLIST D'AUTO-ÉVALUATION (Visible uniquement si correction affichée) */}
      {hintLevel === 3 && checklist && checklist.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Auto-évaluation</h3>
            <span className="text-lg font-bold px-4 py-1 bg-gray-100 rounded-full">
              Score : <span className={currentScore === totalScore ? "text-green-600" : "text-blue-600"}>{currentScore}</span> / {totalScore}
            </span>
          </div>
          
          <div className="space-y-3">
            {checklist.map((item, index) => (
              <label 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
              >
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={checkedItems.includes(index)}
                  onChange={() => handleToggleCheck(index)}
                />
                <div className="flex-1">
                  <span className={`block ${checkedItems.includes(index) ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                    {item.description}
                  </span>
                </div>
                <span className="font-semibold text-gray-600 whitespace-nowrap">
                  {item.points} pt{item.points > 1 ? 's' : ''}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}