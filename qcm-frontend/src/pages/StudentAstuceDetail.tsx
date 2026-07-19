import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import { useParams, useNavigate } from "react-router-dom";

import "katex/dist/katex.min.css";

import PdfViewer from "../components/PdfViewer";

// Remplacer les anciens imports par :
import { renderWithMath } from "../utils/mathUtils";

/* ================= TYPES ================= */

interface TipCase {
  title?: string;
  content?: string;
  explanation?: string;
  example?: string;
  image?: string; 
}

interface Tip {
  _id: string;
  subject?: string;
  chapter?: string;
  title?: string;
  description?: string;
  cases?: TipCase[];
  pdfUrl?: string;
}

/* ================= COMPONENT ================= */

const StudentAstuceDetail = ({ id, onBack }: any) => {

  if (!id) return <div>Astuce introuvable</div>;
  
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentCase, setCurrentCase] = useState(0);

  useEffect(() => {
    if (id) fetchTip();
  }, [id]);

  const fetchTip = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/astuces/detail/${id}`);
      const data = res.data;

      data.cases = Array.isArray(data.cases)
        ? data.cases.filter(Boolean)
        : [];

      setTip(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;
  if (!tip) return <div className="p-10 text-red-500">Introuvable</div>;

  const current = tip.cases?.[currentCase];

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <button onClick={onBack} className="mb-4 text-blue-600">
        ← Retour
      </button>

      {/* 🔥 PDF */}
      {tip.pdfUrl && (
        <div className="mt-6">
          <PdfViewer url={tip.pdfUrl} />
        </div>
      )}

      {/* 🔥 SLIDE */}
      {current && (
        <div className="mt-10 bg-white p-6 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-4">
            {current.title || `Cas ${currentCase + 1}`}
          </h2>

          {current.content && (
            <div className="prose max-w-none">{renderWithMath(current.content)}</div>
          )}

          {current.example && (
            <div className="bg-gray-100 p-3 mt-4 rounded">
              {renderWithMath(current.example)}
            </div>
          )}

          {current.image && (
            <img
              src={current.image}
              alt="astuce"
              loading="lazy"
              className="max-h-48 mx-auto object-contain rounded-lg shadow mt-4"
            />
          )}

          <button
            className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
            onClick={() =>
              window.location.href = `/student/quiz/${tip._id}?case=${currentCase}`
            }
          >
            🧠 Quiz
          </button>

        </div>
      )}
    </div>
  );
};

export default StudentAstuceDetail;