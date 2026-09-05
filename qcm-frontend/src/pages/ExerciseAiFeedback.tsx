import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface ExerciseAiFeedbackProps {
  exerciseId: string;
  questionText: string;
}

const ExerciseAiFeedback: React.FC<ExerciseAiFeedbackProps> = ({ exerciseId, questionText }) => {
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!studentAnswer.trim()) return;
    
    setLoading(true);
    setFeedback(null);

    try {
      // Vous devrez créer cette route côté backend pour analyser la réponse
      const response = await axios.post(`${API_BASE_URL}/api/ai/feedback`, {
        exerciseId,
        questionText,
        studentAnswer
      });
      
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error("Erreur lors de la récupération du feedback", error);
      setFeedback("Impossible d'obtenir une correction de l'IA pour le moment. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm mt-4">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Votre réponse</h3>
      
      <textarea
        value={studentAnswer}
        onChange={(e) => setStudentAnswer(e.target.value)}
        placeholder="Rédigez votre réponse ici..."
        rows={4}
        className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-teal-500 focus:border-teal-500 resize-y"
      />
      
      <button
        onClick={handleSubmit}
        disabled={loading || !studentAnswer.trim()}
        className={`px-6 py-2 rounded-lg text-white font-bold transition ${loading || !studentAnswer.trim() ? "bg-teal-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}`}
      >
        {loading ? "Analyse en cours..." : "Demander une correction IA"}
      </button>

      {feedback && (
        <div className="mt-6 p-5 bg-teal-50 rounded-lg border-l-4 border-teal-500">
          <h4 className="font-bold text-teal-800 flex items-center gap-2 mb-2">
            <span>🤖</span> Retour du tuteur IA
          </h4>
          <div className="text-gray-700 whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseAiFeedback;