// src/pages/AstucePage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AnimatedQaViewer from "../components/AnimatedQaViewer";

// Exemple de données (tu pourras remplacer par API plus tard)
const ASTUCES: Record<string, { chapter: string; qas: { question: string; answer: string }[] }[]> = {
  math: [
    {
      chapter: "Les suites",
      qas: [
        { question: "Qu’est-ce qu’une suite ?", answer: "Une suite est une fonction définie sur ℕ..." },
        { question: "Limite d’une suite", answer: "On dit qu’une suite a une limite L si pour tout ε>0..." },
      ],
    },
    {
      chapter: "La probabilité",
      qas: [
        { question: "Probabilité : définition", answer: "La probabilité mesure la chance d’un événement..." },
        { question: "Événements indépendants", answer: "Deux événements A et B sont indépendants si..." },
      ],
    },
  ],

  physique: [
    {
      chapter: "Cinématique",
      qas: [
        { question: "MRU", answer: "Le mouvement rectiligne uniforme est caractérisé par..." },
      ],
    },
  ],

  chimie: [
    {
      chapter: "Structure de la matière",
      qas: [{ question: "Atome", answer: "Un atome est composé d’un noyau et d’électrons..." }],
    },
  ],

  svt: [
    {
      chapter: "Génétique",
      qas: [{ question: "ADN", answer: "L’ADN contient l’information génétique..." }],
    },
  ],
};

export default function AstucePage() {
  const { matiere } = useParams();
  const navigate = useNavigate();

  const data = ASTUCES[matiere || ""] || [];
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const titre =
    matiere === "math"
      ? "Mathématique"
      : matiere === "physique"
      ? "Physique"
      : matiere === "chimie"
      ? "Chimie"
      : "SVT";

  const chapterData = data.find((d) => d.chapter === selectedChapter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50 p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
      >
        🔙 Retour
      </button>

      <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">
        💡 {titre}
      </h1>

      {/* Si aucun chapitre sélectionné → afficher la liste */}
      {!selectedChapter && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {data.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedChapter(item.chapter)}
              className="bg-white border shadow rounded-xl p-4 text-center font-semibold hover:bg-indigo-50 transition"
            >
              {item.chapter}
            </button>
          ))}
        </div>
      )}

      {/* Si un chapitre est sélectionné → afficher l’Animated Viewer */}
      {selectedChapter && chapterData && (
        <div className="max-w-2xl mx-auto mt-8">
          <button
            onClick={() => setSelectedChapter(null)}
            className="mb-4 bg-indigo-200 hover:bg-indigo-300 px-4 py-2 rounded"
          >
            ← Retour aux chapitres
          </button>

          <h2 className="text-2xl font-bold mb-4 text-indigo-600 text-center">
            📘 {selectedChapter}
          </h2>

          <AnimatedQaViewer qas={chapterData.qas} />
        </div>
      )}
    </div>
  );
}
