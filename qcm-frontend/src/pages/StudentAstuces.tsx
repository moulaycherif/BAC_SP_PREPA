import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";

interface Tip {
  _id: string;
  subject: string;
  chapter: string;
  title: string;
  description: string;
}

const StudentAstuces: React.FC = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tips`);
      setTips(res.data);

      const uniqueSubjects = [...new Set(res.data.map((t: Tip) => t.subject))];
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error("Erreur chargement astuces :", err);
    }
  };

  // Mise à jour des chapitres selon la matière
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setSelectedChapter("");
      return;
    }

    const filtered = tips.filter(t => t.subject === selectedSubject);
    const uniqueChapters = [...new Set(filtered.map(t => t.chapter))];
    setChapters(uniqueChapters);
  }, [selectedSubject, tips]);

  const filteredTips = tips.filter(t =>
    (selectedSubject ? t.subject === selectedSubject : true) &&
    (selectedChapter ? t.chapter === selectedChapter : true)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        💡 Astuces du Soutien
      </h1>

      {/* FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border p-3 rounded-lg"
        >
          <option value="">Toutes les matières</option>
          {subjects.map(subj => (
            <option key={subj} value={subj}>{subj}</option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="border p-3 rounded-lg"
          disabled={!selectedSubject}
        >
          <option value="">Tous les chapitres</option>
          {chapters.map(chap => (
            <option key={chap} value={chap}>{chap}</option>
          ))}
        </select>
      </div>

      {/* LISTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTips.map(tip => (
          <div
            key={tip._id}
            className="border rounded-xl p-5 shadow hover:shadow-lg cursor-pointer bg-white"
            onClick={() => navigate(`/student/astuces/${tip._id}`)}
          >
            <div className="text-sm text-gray-500">
              {tip.subject} • {tip.chapter}
            </div>
            <h2 className="text-xl font-semibold mt-2">{tip.title}</h2>
            <p className="text-gray-600 mt-2">
              {tip.description || "Voir les astuces détaillées"}
            </p>
          </div>
        ))}

        {filteredTips.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            Aucune astuce disponible
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAstuces;
