import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BacSimulatorIndex = () => {
  const navigate = useNavigate();

  // États pour stocker les sélections de l'étudiant
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedSession, setSelectedSession] = useState('Normale');
  const [selectedTheme, setSelectedTheme] = useState('Electricite');

  // TODO: Remplacer ces tableaux statiques par un appel API (useEffect)
  // ex: axios.get('/api/available-exams').then(...)
  const availableYears = ['2026', '2025', '2024', '2023', '2022'];
  const availableSessions = ['Normale', 'Rattrapage'];
  const availableThemes = ['Electricite', 'Mécanique', 'Ondes', 'Nucléaire'];

  const handleStartExam = () => {
    // Validation basique
    if (!selectedYear || !selectedSession || !selectedTheme) return;

    // Formatage des paramètres pour l'URL (minuscules, sans accents idéalement)
    const formattedSession = selectedSession.toLowerCase();
    const formattedTheme = selectedTheme.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Redirection vers l'espace de travail (Step 2)
    navigate(`/bac-simulator/physique/${selectedYear}/${formattedSession}/${formattedTheme}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Bac Simulator 🎓</h1>
      <p className="text-gray-500 mb-8">Configurez votre session d'entraînement avant de commencer.</p>

      <div className="space-y-6">
        {/* Dropdown : Année */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Année de l'examen</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Dropdown : Session */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
          <select 
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availableSessions.map(session => (
              <option key={session} value={session}>{session}</option>
            ))}
          </select>
        </div>

        {/* Dropdown : Thème */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thème de l'exercice</label>
          <select 
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {availableThemes.map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bouton de lancement */}
      <div className="mt-10">
        <button 
          onClick={handleStartExam}
          className="w-full bg-indigo-600 text-white text-lg font-bold py-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <span>🚀</span> Commencer l'épreuve
        </button>
      </div>
    </div>
  );
};

export default BacSimulatorIndex;