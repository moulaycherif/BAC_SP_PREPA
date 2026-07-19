import { useEffect, useState } from "react";
import axios from "../api/axios";

import { API_BASE_URL } from "../config";

/* ============================================================
   📦 TYPES
============================================================ */

interface Question {
  _id: string;
  texte?: string;
  image?: string | null;

  groupId?: {
    _id: string;
    image?: string | null;
  } | null;

  options: string[];
  reponseCorrecte: string;
  subject: string;
  exam: string;
}

/* ============================================================
   🧠 COMPONENT
============================================================ */

export default function QuestionBrowser() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     📡 FETCH QUESTIONS
  ============================================================ */

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API}/api/questions`);
        console.log("📦 QUESTIONS REÇUES :", res.data);
        setQuestions(res.data);
      } catch (err) {
        console.error("❌ Erreur chargement questions", err);
        setError("Impossible de récupérer les questions 😢");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) return <p>Chargement des questions...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  /* ============================================================
     🖼 LOGIQUE AFFICHAGE IMAGE UNIQUE PAR GROUPE
  ============================================================ */

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        📚 QCM — Liste des questions
      </h2>

      <ul className="space-y-8">
        {questions.map((q, index) => {
          const image = q.groupId?.image || q.image;

          const previous = questions[index - 1];

          const showImage =
            image &&
            (!q.groupId ||
              !previous ||
              previous.groupId?._id !== q.groupId._id);

          return (
            <li
              key={q._id}
              className="p-4 border rounded-lg shadow bg-white space-y-4"
            >
              {/* 🖼 IMAGE (UNE SEULE FOIS PAR GROUPE) */}
              {showImage && (
                <img
                  src={`${API_BASE_URL}${image}`}
                  className="max-w-full rounded shadow"
                  alt="Illustration"
                />
              )}

              {/* 📝 TEXTE */}
              {q.texte && (
                <p className="font-medium text-gray-800">
                  {index + 1}. {q.texte}
                </p>
              )}

              {/* OPTIONS */}
              <ul className="list-disc pl-6 space-y-1">
                {q.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
