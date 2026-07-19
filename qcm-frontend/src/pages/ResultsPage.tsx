import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ResultDetail {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Récupération des données transmises depuis ExamPage
  const { details, score, total } = location.state || {
    details: [],
    score: 0,
    total: 0,
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Résultats du Quiz</h1>

      <div className="p-4 bg-gray-100 rounded-lg shadow mb-6">
        <p className="text-xl">
          Score : <span className="font-bold">{score} / {total}</span>
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Détails :</h2>
      <ul className="space-y-4">
        {details.map((d: ResultDetail, idx: number) => (
          <li
            key={idx}
            className={`p-4 rounded-lg shadow ${
              d.isCorrect ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <p className="font-medium">{d.question}</p>
            <p>
              Ta réponse :{" "}
              <span className={d.isCorrect ? "text-green-700" : "text-red-700"}>
                {d.userAnswer || "❌ Pas de réponse"}
              </span>
            </p>
            {!d.isCorrect && (
              <p className="text-gray-700">
                ✅ Bonne réponse : {d.correctAnswer}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔙 Retour à l'accueil
        </button>
      </div>
    </main>
  );
}
