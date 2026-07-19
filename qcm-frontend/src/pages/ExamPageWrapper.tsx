import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import QuizPage from "./StudentQuiz";

interface Question {
  _id?: string;
  texte: string;
  options: string[];
  reponseCorrecte: string;
  note: number;
}

const ExamPageWrapper: React.FC = () => {
  const { examName } = useParams<{ examName: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examName) {
      setLoading(true);
      axios
        .get(
          `http://localhost:5000/api/questions?exam=${encodeURIComponent(
            examName
          )}`
        )
        .then((res) => {
          // Adapter les champs pour le front
          const adaptedQuestions = res.data.map((q: any) => ({
            _id: q._id,
            texte: q.questionText, // de MongoDB
            options: q.options,
            reponseCorrecte: q.correctAnswer, // de MongoDB
            note: q.note ?? 1,
          }));
          setQuestions(adaptedQuestions);
        })
        .catch((err) =>
          console.error("Erreur récupération questions :", err)
        )
        .finally(() => setLoading(false));
    }
  }, [examName]);

  if (!examName) return <p>❌ Aucun examen sélectionné</p>;
  if (loading) return <p>Chargement des questions...</p>;
  if (questions.length === 0)
    return <p>❌ Aucune question trouvée pour "{examName}"</p>;

  return <QuizPage concours={examName} questions={questions} />;
};

export default ExamPageWrapper;
