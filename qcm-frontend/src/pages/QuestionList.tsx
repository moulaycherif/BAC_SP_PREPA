import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";

interface Question {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  subject: string;
  exam: string;
}

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const exam = params.get("exam");

        const url = exam
          ? `http://localhost:5000/api/questions/exam/${encodeURIComponent(
              exam
            )}`
          : "http://localhost:5000/api/questions";

        const res = await axios.get(url);

        // ✅ supprimer doublons côté front
        const uniqueQuestions = Array.from(
          new Map(
            res.data.map((q: Question) => [q.questionText.trim(), q])
          ).values()
        );

        setQuestions(uniqueQuestions);
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des questions :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [location.search]);

  if (loading) return <p>⏳ Chargement des questions...</p>;

  return (
    <div className="p-6">
      {/* ✅ Bouton retour corrigé */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        ⬅ Retour au Dashboard
      </button>

      <h2 className="text-xl font-bold mb-4">📋 Liste des questions</h2>
      {questions.length === 0 && <p>Aucune question disponible.</p>}
      {questions.map((q) => (
        <div
          key={q._id}
          className="mb-6 p-4 border rounded shadow-sm bg-white"
        >
          <p className="font-semibold">{q.questionText}</p>
          <ul className="ml-4 list-disc">
            {q.options.map((opt, i) => (
              <li key={i}>
                {opt} {opt === q.correctAnswer && "✅"}
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            📘 Matière : {q.subject || "Inconnue"} | 🎓 Examen :{" "}
            {q.exam || "Non défini"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
