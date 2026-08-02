import React, { useState, useRef } from 'react';

const AiCorrectionScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion de la sélection du fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setAiFeedback(null); // On réinitialise le feedback si on change d'image
    }
  };

  // Simulation de l'appel API vers l'IA
  const handleScanClick = () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    // ⏳ Simulation d'un traitement serveur de 3 secondes
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiFeedback(
        "🎯 Analyse terminée ! Ton raisonnement global est excellent. Cependant, attention à la question 2 : tu as oublié de convertir les unités en SI avant de faire l'application numérique. Note estimée pour cette partie : 4/5."
      );
    }, 3000);
  };

  const resetScanner = () => {
    setFile(null);
    setPreviewUrl(null);
    setAiFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-grow flex flex-col">
      <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">🤖 Correction par IA</h3>
      
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 hover:bg-purple-100 cursor-pointer transition p-6 text-center"
        >
          <span className="text-4xl mb-3">📸</span>
          <span className="font-semibold text-purple-700">Prends en photo ou importe ta copie</span>
          <span className="text-sm text-gray-500 mt-2">Formats acceptés : JPG, PNG</span>
        </div>
      ) : (
        <div className="flex flex-col items-center flex-grow">
          <div className="relative w-full max-w-sm mb-6 rounded-lg overflow-hidden border border-gray-300 shadow-md">
            <img src={previewUrl!} alt="Aperçu de la copie" className="w-full h-auto" />
            {!isAnalyzing && !aiFeedback && (
              <button 
                onClick={resetScanner}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow"
                title="Changer d'image"
              >
                ✕
              </button>
            )}
          </div>

          {!aiFeedback ? (
            <button 
              onClick={handleScanClick}
              disabled={isAnalyzing}
              className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                isAnalyzing ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">⏳</span> Analyse en cours...
                </>
              ) : (
                <>
                  <span>✨</span> Lancer l'analyse IA
                </>
              )}
            </button>
          ) : (
            <div className="w-full bg-green-50 border border-green-200 p-4 rounded-lg animate-fade-in">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <span>✅</span> Retour de l'IA
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {aiFeedback}
              </p>
              <button 
                onClick={resetScanner}
                className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded transition"
              >
                Scanner un autre exercice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input caché utilisé par le bouton de la zone de drag & drop */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
};

export default AiCorrectionScanner;