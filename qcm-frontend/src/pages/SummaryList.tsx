import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";

interface Summary {
  _id: string;
  title: string;
  subject: string;
  chapter: string;
  pdfUrl: string;
  createdAt: string;
}

const SummaryList: React.FC = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [filtered, setFiltered] = useState<Summary[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    fetchSummaries();
  }, []);

  // Charger tous les résumés
  const fetchSummaries = async () => {
    try {
      const response = await axios.get("https://med-contest-backend.onrender.com/api/resume/all");
      const allSummaries = response.data;

      setSummaries(allSummaries);
      setFiltered(allSummaries);

      // Extraire les matières uniques
      const uniqueSubjects = [...new Set(allSummaries.map((s: Summary) => s.subject))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error("Erreur chargement résumés:", err);
    }
  };

  // Appliquer filtre
  const filterBySubject = (subject: string) => {
    setSelectedSubject(subject);

    if (subject === "") {
      setFiltered(summaries);
    } else {
      setFiltered(summaries.filter((s) => s.subject === subject));
    }
  };

  // Supprimer un résumé
  const deleteSummary = async (id: string) => {
    if (!window.confirm("Confirmer la suppression ?")) return;

    try {
      await axios.delete(`https://med-contest-backend.onrender.com/api/resume/${id}`);
      setSummaries(summaries.filter((s) => s._id !== id));
      setFiltered(filtered.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4 text-center">Liste des Résumés (ADMIN)</h1>

      {/* FILTRE PAR MATIÈRE */}
      <div className="mb-5 w-full flex justify-center">
        <select
          value={selectedSubject}
          onChange={(e) => filterBySubject(e.target.value)}
          className="border border-gray-400 p-2 rounded-lg bg-white shadow-sm"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>

      {/* TABLEAU */}
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Titre</th>
            <th className="border p-2">Matière</th>
            <th className="border p-2">Chapter</th>
            <th className="border p-2">PDF</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((s) => (
            <tr key={s._id} className="text-center">
              <td className="border p-2">{s.title}</td>
              <td className="border p-2">{s.subject}</td>
              <td className="border p-2">{s.chapter}</td>

              <td className="border p-2">
                <a
                  href={s.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Ouvrir PDF
                </a>
              </td>

              <td className="border p-2">
                {new Date(s.createdAt).toLocaleDateString()}
              </td>

              <td className="border p-2">
                <button
                  onClick={() => deleteSummary(s._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                Aucun résumé trouvé pour cette matière
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryList;