import React, { useState } from 'react';

const StudentCorrection = ({ exerciseId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // Gérer la sélection de l'image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setReport(null); // On réinitialise le rapport si on change d'image
      setError("");
    }
  };

  // Gérer l'envoi au backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Veuillez sélectionner une image de votre copie.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Utilisation de FormData car on envoie un fichier (multipart/form-data)
    const formData = new FormData();
    formData.append("image", selectedFile); // "image" doit correspondre à ce qu'attend votre multer dans le backend
    formData.append("exerciseId", exerciseId);

    try {
      // Ajustez l'URL selon votre route exacte dans le backend
      const response = await fetch("http://localhost:5000/api/bac/correct", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors de la correction.");
      }

      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Correction IA de votre copie</h2>

      {/* ZONE D'UPLOAD */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col items-center justify-center w-full mb-4">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <span className="text-4xl mb-3">📸</span>
              <p className="mb-2 text-sm text-gray-500 font-semibold">Cliquez pour ajouter la photo de votre copie</p>
              <p className="text-xs text-gray-500">PNG, JPG (Max 5MB)</p>
            </div>
            <input 
              id="dropzone-file" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>
        </div>

        {/* PRÉVISUALISATION DE L'IMAGE */}
        {previewUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
            <img src={previewUrl} alt="Aperçu copie" className="max-h-64 mx-auto rounded-lg shadow-sm border" />
          </div>
        )}

        {/* MESSAGES D'ERREUR */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* BOUTON SOUMETTRE */}
        <button 
          type="submit" 
          disabled={isLoading || !selectedFile}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold transition ${isLoading || !selectedFile ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
        >
          {isLoading ? "L'IA analyse votre copie... ⏳" : "Faire corriger par l'IA ✨"}
        </button>
      </form>

      {/* AFFICHAGE DU RAPPORT DE CORRECTION */}
      {report && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200 mt-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-green-200 pb-4 mb-4">
            <h3 className="text-xl font-bold text-green-800">Résultat de la correction</h3>
            <span className="text-2xl font-black text-green-700 bg-white px-4 py-2 rounded-lg shadow-sm">
              {report.noteAttribuee} / {report.noteMaximale}
            </span>
          </div>

          <p className="text-gray-700 mb-6 italic">"{report.feedbackGlobal}"</p>

          <h4 className="font-bold text-gray-800 mb-3 border-b pb-1">Détail du barème :</h4>
          <ul className="space-y-3 mb-6">
            {report.validationEtapes.map((etape, index) => (
              <li key={index} className="flex flex-col bg-white p-3 rounded-lg shadow-sm text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800">{etape.critere}</span>
                  <span className={`font-bold ${etape.valide ? 'text-green-600' : 'text-red-500'}`}>
                    {etape.valide ? '✅ Validé' : '❌ Non validé'} ({etape.pointsObtenus} pt)
                  </span>
                </div>
                <span className="text-gray-600 text-xs text-left">{etape.explication}</span>
              </li>
            ))}
          </ul>

          {report.erreursRigueur && report.erreursRigueur.length > 0 && (
            <>
              <h4 className="font-bold text-orange-800 mb-3 border-b border-orange-200 pb-1">⚠️ Conseils de rigueur :</h4>
              <ul className="list-disc pl-5 text-sm text-orange-700 bg-orange-50 p-4 rounded-lg">
                {report.erreursRigueur.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCorrection;