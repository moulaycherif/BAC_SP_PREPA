import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BacSimulatorIndex() {
  const navigate = useNavigate();

  // États pour stocker les choix de l'étudiant
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  // Données fictives pour les menus déroulants (à remplacer par des données API plus tard)
  const years = ['2023', '2022', '2021', '2020'];
  const sessions = ['Normale', 'Rattrapage'];
  const themes = ['Mécanique', 'Électricité', 'Ondes', 'Suivi temporel', 'Acide-Base'];

  const handleStart = () => {
    if (!selectedYear || !selectedSession || !selectedTheme) {
      alert("Veuillez sélectionner une année, une session et un thème pour commencer.");
      return;
    }
    // Navigation vers l'espace de travail Dual-Panel
    navigate('/student/bac-simulator/workspace');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 border border-gray-200">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-2">BAC SIMULATOR</h1>
          <p className="text-lg text-gray-500">
            Configure ton épreuve sur-mesure et entraîne-toi en conditions réelles.
          </p>
        </div>

        {/* Système de filtres */}
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
              {years.map(y => <option key={y} value={y}>{y}</option>)}
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
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
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
              {themes.map(t => <option key={t} value={t}>{t}</option>)}
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

      </div>
    </div>
  );
}