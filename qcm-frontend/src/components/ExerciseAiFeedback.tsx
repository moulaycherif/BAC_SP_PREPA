import React, { useState } from "react";
import api from "../api/axios";

interface ExerciseAiFeedbackProps {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  isSubmitted: boolean;
  subject: string;
  onFeedbackReceived?: (questionId: string, data: any) => void; // NOUVEAU
}

const ExerciseAiFeedback: React.FC<ExerciseAiFeedbackProps> = ({ 
  questionId, 
  questionText, 
  correctAnswer, 
  subject,
  onFeedbackReceived // NOUVEAU
}) => {
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!studentAnswer.trim()) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      const response = await api.post(`/api/ai/feedback`, {
        questionId,
        questionText,
        studentAnswer,
        correctAnswer,
        subject
      });
      
      const { isCorrect, score, feedback: apiFeedback } = response.data;
      setFeedback(apiFeedback);

      // NOUVEAU : Remontée au parent
      if (onFeedbackReceived) {
        onFeedbackReceived(questionId, {
          isCorrect: isCorrect === true,
          score: score || (isCorrect ? 1 : 0),
          feedback: apiFeedback
        });
      }
      
    } catch (error) {
      console.error("Erreur lors de la récupération du feedback", error);
      setFeedback("Impossible d'obtenir une correction pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-sm mt-4">
      <h3 className="text-md font-bold text-gray-800 mb-2">💻 Option 1 : Rédiger votre réponse</h3>
      
      <textarea
        value={studentAnswer}
        onChange={(e) => setStudentAnswer(e.target.value)}
        placeholder="Saisissez votre démonstration ou calcul ici..."
        rows={4}
        className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-teal-500 focus:border-teal-500 text-sm"
      />
      
      <button
        onClick={handleSubmit}
        disabled={loading || !studentAnswer.trim()}
        className={`px-5 py-2 rounded-lg text-white font-bold text-sm transition ${
          loading || !studentAnswer.trim() ? "bg-teal-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
        }`}
      >
        {loading ? "Analyse par l'IA..." : "Soumettre pour correction IA"}
      </button>

      {feedback && (
        <div className="mt-4 p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
          <h4 className="font-bold text-teal-800 flex items-center gap-2 mb-1 text-sm">🤖 Correction IA</h4>
          <div className="text-gray-700 text-sm whitespace-pre-wrap">{feedback}</div>
        </div>
      )}
    </div>
  );
};

export default ExerciseAiFeedback;