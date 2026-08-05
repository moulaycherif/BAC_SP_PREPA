import React, { useState } from 'react';
import axios from '../api/axios';

export default function AdminExamUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return alert("Sélectionnez un fichier Excel !");

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setStatusMessage("Importation en cours et génération des indices par l'IA...");

    try {
      const res = await axios.post('/admin/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMessage(`✅ Success: ${res.data.message}`);
    } catch (err) {
      setStatusMessage("❌ Échec de l'importation. Vérifiez la structure du fichier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow border mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📥 Importation Examen (Excel)</h2>
      
      <input 
        type="file" 
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition"
      >
        {loading ? "Traitement par l'IA..." : "Importer et Générer l'Épreuve"}
      </button>

      {statusMessage && <p className="mt-4 text-center font-semibold text-gray-700">{statusMessage}</p>}
    </div>
  );
}