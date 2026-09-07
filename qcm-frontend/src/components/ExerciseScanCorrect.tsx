import React, { useState } from "react";
import api from "../api/axios";

interface ExerciseScanCorrectProps {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  subject: string;
}

const ExerciseScanCorrect: React.FC<ExerciseScanCorrectProps> = ({
  questionId,
  questionText,
  correctAnswer,
  subject,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<string | null>(null);
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
      setErrorMsg("Veuillez sélectionner une photo ou un fichier PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("questionId", questionId);
    formData.append("questionText", questionText);
    formData.append("correctAnswer", correctAnswer);
    formData.append("subject", subject);

    setLoading(true);
    setErrorMsg("");
    setReport(null);

    try {
      const response = await api.post(`/api/ai/scan-correct`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(response.data.report || response.data.feedback);
    } catch (error) {
      console.error("Erreur lors du scan :", error);
      setErrorMsg("Une erreur est survenue lors de l'analyse par Examinateur IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm mt-4">
      <h3 className="text-md font-bold text-indigo-900 mb-2">📸 Option 2 : Scan & Correct (Examinateur IA)</h3>
      
      <form onSubmit={handleUpload} className="space-y-3">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />

        {previewUrl && (
          <img src={previewUrl} alt="Aperçu" className="max-h-40 rounded border object-contain mx-auto my-2" />
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`px-5 py-2 rounded-lg text-white font-bold text-sm transition ${
            loading || !file ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Analyse de la copie..." : "Analyser la démarche"}
        </button>
      </form>

      {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}

      {report && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
          <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-1 text-sm">📋 Rapport personnalisé</h4>
          <div className="text-gray-700 text-sm whitespace-pre-wrap">{report}</div>
        </div>
      )}
    </div>
  );
};

export default ExerciseScanCorrect;