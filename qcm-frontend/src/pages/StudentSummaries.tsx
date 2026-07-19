import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { API_BASE_URL } from "../config";

interface ResumeItem {
  id: string;
  subject: string;
  chapter: string;
  url: string;
  created_at: string | null;
}

export default function StudentSummaries({
  selectedSubject,
  selectedChapter,
}: {
  selectedSubject: string | null;
  selectedChapter: string | null;
}) {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [filtered, setFiltered] = useState<ResumeItem[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // 🔐 Ouvrir un PDF via Signed URL
  const openPdf = async (id: string) => {
    try {
      setLoadingId(id);
      const res = await api.get(`/api/resume/signed/${id}`);
      window.open(res.data.signedUrl, "_blank");
    } catch (err) {
      console.error("Erreur ouverture PDF :", err);
      alert("Impossible d’ouvrir le PDF");
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    if (!selectedSubject) return;

    api.get(`/api/resume/by-subject/${selectedSubject}`)
      .then((res) => {
        const all: ResumeItem[] = res.data;
        setResumes(all);

        if (!selectedChapter) {
          setFiltered(all);
          return;
        }

        // 🎯 Filtrage EXACT par chapitre
        const cleanedSelected = selectedChapter
          .toLowerCase()
          .trim()
          .replace(/\s+/g, " ");

        const filteredList = all.filter((r) => {
          const cleanedChap = r.chapter
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");
          return cleanedChap === cleanedSelected;
        });

        setFiltered(filteredList);
      })
      .catch((err) =>
        console.error("Erreur fetch résumés étudiant :", err)
      );
  }, [selectedSubject, selectedChapter]);

  // 📚 Groupement par chapitre
  const grouped = filtered.reduce<Record<string, ResumeItem[]>>(
    (acc, item) => {
      if (!acc[item.chapter]) acc[item.chapter] = [];
      acc[item.chapter].push(item);
      return acc;
    },
    {}
  );

  return (
    <div>
       {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">
          Aucun résumé disponible.
        </p>
      ) : (
        Object.keys(grouped).map((chapter) => (
          <div key={chapter} className="mb-8">
            <h4 className="text-lg font-bold text-blue-700 mb-3">
              📘 {chapter}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {grouped[chapter].map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
                >
                  <p className="text-sm text-gray-500">
                    {item.created_at
                      ? item.created_at.slice(0, 10)
                      : "Date inconnue"}
                  </p>

                  <button
                    onClick={() => openPdf(item.id)}
                    disabled={loadingId === item.id}
                    className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loadingId === item.id
                      ? "Ouverture..."
                      : "📄 Voir le PDF"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
