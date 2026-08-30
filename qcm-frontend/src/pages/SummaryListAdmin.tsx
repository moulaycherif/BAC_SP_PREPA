import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";

interface ResumeItem {
  _id: string;
  subject: string;
  chapter: string;
  pdfUrl: string;
  createdAt: string;
}

const SummaryListAdmin: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [filtered, setFiltered] = useState<ResumeItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const fetchResumes = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/resume/all`);
    setResumes(res.data);

    const uniqueSubjects = [...new Set(res.data.map((r: ResumeItem) => r.subject))];
    setSubjects(uniqueSubjects);

    setFiltered(res.data);
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedSubject === "") {
      setFiltered(resumes);
    } else {
      setFiltered(resumes.filter((r) => r.subject === selectedSubject));
    }
  }, [selectedSubject, resumes]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📚 Résumés Générés (Admin)</h2>

      {/* FILTRE PAR MATIÈRE */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Filtrer par matière :</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border px-2 py-1"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* TABLEAU */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-2 py-1">Matière</th>
            <th className="border px-2 py-1">Chapter</th>
            <th className="border px-2 py-1">PDF</th>
            <th className="border px-2 py-1">Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r._id} className="text-sm">
              <td className="border px-2 py-1">{r.subject}</td>
              <td className="border px-2 py-1">{r.chapter}</td>
              <td className="border px-2 py-1">
                <a
                  href={r.pdfUrl + "?v=" + Date.now()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  📄 Ouvrir
                </a>
              </td>
              <td className="border px-2 py-1">
                {new Date(r.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryListAdmin;
