import React, { useEffect, useState } from "react";
import axios from "../api/axios";
// import { API_BASE_URL } from "../config"; // Décommentez si vous souhaitez l'utiliser pour l'URL

interface Summary {
  _id: string;
  title: string;
  subject: string;
  chapter: string;
  pdfUrl: string;
  createdAt: string;
}

console.log("WAW KIFACH")
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
      const allSummaries: Summary[] = response.data;

      setSummaries(allSummaries);
      setFiltered(allSummaries);

      // Correction de l'erreur TypeScript avec Array.from() au lieu du spread operator [...]
      const uniqueSubjects = Array.from(new Set(allSummaries.map((s) => s.subject)));
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
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">
        📂 Liste des Résumés
      </h2>

      {/* FILTRE PAR MATIÈRE */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-slate-100 p-5 rounded-xl border border-slate-200 shadow-inner">
        <label className="font-bold text-gray-800">Filtrer par matière :</label>
        <select
          value={selectedSubject}
          onChange={(e) => filterBySubject(e.target.value)}
          className="border-2 border-gray-300 px-4 py-2 rounded-lg bg-white text-gray-900 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors min-w-[250px] shadow-sm cursor-pointer"
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
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-300">
        <table className="w-full border-collapse">
          <thead className="bg-indigo-50 border-b-2 border-indigo-200">
            <tr>
              <th className="p-4 text-left font-extrabold text-indigo-900">Titre</th>
              <th className="p-4 text-left font-extrabold text-indigo-900">Matière</th>
              <th className="p-4 text-left font-extrabold text-indigo-900">Chapitre</th>
              <th className="p-4 text-center font-extrabold text-indigo-900">PDF</th>
              <th className="p-4 text-center font-extrabold text-indigo-900">Date</th>
              <th className="p-4 text-center font-extrabold text-indigo-900">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filtered.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-gray-900 font-bold">{s.title}</td>
                <td className="p-4 text-gray-800 font-medium">{s.subject}</td>
                <td className="p-4 text-gray-800">{s.chapter}</td>

                <td className="p-4 text-center">
                  <a
                    href={s.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold underline decoration-blue-300 hover:decoration-blue-700 transition-colors"
                  >
                    👁️ Ouvrir
                  </a>
                </td>

                <td className="p-4 text-center text-gray-600 font-medium">
                  {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                </td>

                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteSummary(s._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold shadow-md transition-transform transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-500 font-medium bg-gray-50/50 italic">
                  Aucun résumé trouvé pour cette matière.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryList;