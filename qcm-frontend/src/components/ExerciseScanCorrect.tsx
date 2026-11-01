import React, { useState } from "react";
import api from "../api/axios";

interface ExerciseScanCorrectProps {
  exerciseId: string;
  subQuestions: any[];
  subject: string;
  context?: string;
  onFeedbackReceived?: (feedbacks: { [questionId: string]: any }) => void;
}

const ExerciseScanCorrect: React.FC<ExerciseScanCorrectProps> = ({
  exerciseId,
  subQuestions,
  subject,
  context,
  onFeedbackReceived
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [globalReport, setGlobalReport] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Veuillez sélectionner une image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("exerciseId", exerciseId);
    formData.append("subject", subject);
    formData.append("context", context || "");
    
    // On envoie le tableau des questions simplifié (id, texte, réponse attendue)
    const questionsData = subQuestions.map(q => ({
      id: q._id,
      questionText: q.questionText || q.question || q.texte,
      correctAnswer: q.correctAnswer
    }));
    formData.append("subQuestions", JSON.stringify(questionsData));

    setLoading(true);
    setErrorMsg("");
    setGlobalReport(null);

    try {
      const response = await api.post(`/api/ai/scan-correct-exercise`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { feedbacks, globalReport: apiReport } = response.data;
      
      setGlobalReport(apiReport || "✅ Analyse de la copie terminée.");
      
      if (onFeedbackReceived && feedbacks) {
        onFeedbackReceived(feedbacks);
      }
      
    } catch (error: any) {
      console.error("Erreur lors du scan global :", error);
      setErrorMsg(error.response?.data?.error || "Une erreur est survenue lors de l'analyse par l'IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl">
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept="image/*" // Restreint aux images pour éviter le crash de l'IA avec les PDF natifs
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 cursor-pointer"
        />

        {previewUrl && (
          <img src={previewUrl} alt="Aperçu de la copie" className="max-h-60 rounded-lg border shadow-sm object-contain mx-auto my-3" />
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full py-3 rounded-xl text-white font-bold text-lg transition ${
            loading || !file ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
          }`}
        >
          {loading ? "🤖 Analyse de la copie en cours (merci de patienter)..." : "Scanner et corriger tout l'exercice"}
        </button>
      </form>

      {errorMsg && <p className="mt-3 text-sm font-semibold text-red-600 text-center">{errorMsg}</p>}

      {globalReport && (
        <div className="mt-5 p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500">
          <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2 text-md">📋 Rapport Général IA</h4>
          <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{globalReport}</div>
        </div>
      )}
    </div>
  );
};

export default ExerciseScanCorrect;