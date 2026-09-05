import React, { useState } from "react";
import api from "../api/axios";

const ScanAndUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("cours_complet");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Veuillez sélectionner un fichier.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setLoading(true);
    setMessage("");

    try {
      // Utilisation de 'api' sans spécifier l'URL de base complète
      const response = await api.post(`/api/ai/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setMessage("Génération réussie ! Vous pouvez maintenant télécharger ou importer le fichier Excel.");
      console.log("Résultat:", response.data);
    } catch (error) {
      console.error("Erreur d'upload:", error);
      setMessage("Une erreur est survenue lors de la génération.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold text-teal-800 mb-6 text-center">Générateur de Contenu IA</h2>
      
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document source (PDF)</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de génération</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="qcm">QCM Classique</option>
            <option value="exercise">Exercice Complexe</option>
            <option value="astuce">Astuces / Flashcards</option>
            <option value="resume">Résumé de cours</option>
            <option value="controle">Contrôle d'évaluation</option>
            <option value="cours_complet">Cours Complet (Chapitres & Leçons)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl text-white font-bold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg"}`}
        >
          {loading ? "Génération en cours..." : "Lancer l'IA"}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-center font-medium ${message.includes("Erreur") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ScanAndUpload;