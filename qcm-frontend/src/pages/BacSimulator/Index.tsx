import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBacFilters, BacFilters } from '../../services/bacService';

export default function BacSimulatorIndex() {
  const navigate = useNavigate();

  // États pour les filtres dynamiques (provenant du backend)
  const [filters, setFilters] = useState<BacFilters>({ years: [], sessions: [], themes: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour stocker les choix de l'étudiant
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  // 1️⃣ Charger les filtres dynamiques au montage de la page
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setLoading(true);
        const data = await fetchBacFilters();
        setFilters(data);
        
        // Sélection par défaut des premiers éléments s'ils existent
        if (data.years.length > 0) setSelectedYear(String(data.years[0]));
        if (data.sessions.length > 0) setSelectedSession(data.sessions[0]);
        if (data.themes.length > 0) setSelectedTheme(data.themes[0]);
      } catch (err) {
        setError("Impossible de charger les options d'examens depuis le serveur.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, []);

  // 2️⃣ Valider et lancer l'examen
  const handleStart = () => {
    if (!selectedYear || !selectedSession || !selectedTheme) {
      alert("Veuillez sélectionner une année, une session et un thème pour commencer.");
      return;
    }
    
    // 🚀 Navigation vers l'espace de travail en envoyant les critères dans l'URL
    // Ex: /student/bac-simulator/workspace?annee=2024&session=Normale&theme=Mécanique
    navigate(`/student/bac-simulator/workspace?annee=${selectedYear}&session=${selectedSession}&theme=${selectedTheme}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 border border-gray-200">
        
        {/* Bouton Retour */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition z-10 font-semibold shadow-md flex items-center gap-2 w-fit"
        >
          <span>🔙</span> Retour
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-2">BAC SIMULATOR</h1>
          <p className="text-lg text-gray-500">
            Configure ton épreuve sur-mesure et entraîne-toi en conditions réelles.
          </p>
        </div>

        {/* Gestion du chargement et des erreurs */}
        {loading ? (
          <div className="text-center p-6 text-blue-600 font-semibold animate-pulse">
            ⏳ Chargement des épreuves disponibles...
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-600 font-semibold bg-red-50 rounded-lg">
            ❌ {error}
          </div>
        ) : (
          <>
            {/* Système de filtres dynamiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              
              {/* Filtre : Année */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📅 Année</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Choisir...</option>
                  {filters.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Filtre : Session */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">📝 Session</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="">Choisir...</option>
                  {filters.sessions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Filtre : Thème */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">🔬 Thème</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                >
                  <option value="">Choisir...</option>
                  {filters.themes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  {/* Option Globale Maintenue */}
                  <option value="Toute l'épreuve" className="font-bold text-blue-700">🏆 Toute l'épreuve</option>
                </select>
              </div>

            </div>

            {/* Bouton de validation */}
            <div className="text-center">
              <button 
                onClick={handleStart}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition transform hover:scale-105 text-lg"
              >
                🚀 Commencer l'épreuve
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}