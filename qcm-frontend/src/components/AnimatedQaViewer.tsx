import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import katex from "katex";
import parse from "html-react-parser";
import "katex/dist/katex.min.css";

/* ===================== TYPES ===================== */

interface Case {
  title?: string;
  explanation?: string;
  example?: string;
}

interface Astuce {
  _id: string;
  title?: string;
  description?: string;
  pdfUrl?: string;
  cases?: Case[];
}

interface Props {
  qas: Astuce[];
}

/* ===================== MATH RENDER ===================== */

function renderWithMath(html: string = "") {
  try {
    // 🔥 détecte les expressions simples
    const formatted = html.replace(/\$(.*?)\$/g, (_, expr) =>
      katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
      })
    );

    return parse(formatted);
  } catch (err) {
    console.error("Erreur KaTeX :", err);
    return <span>{html}</span>;
  }
}

/* ===================== COMPONENT ===================== */

const AnimatedQaViewer: React.FC<Props> = ({ qas = [] }) => {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);

  const safeQas = (qas || []).filter(Boolean);

  if (safeQas.length === 0) {
    return (
      <p className="text-center text-gray-500">
        Aucune astuce disponible
      </p>
    );
  }

  const tip = safeQas[current];

  const next = () => {
    if (current < safeQas.length - 1) setCurrent(current + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* 🔥 HEADER NAVIGATION */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prev}
          disabled={current === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          ⬅️ Précédent
        </button>

        <span className="text-sm text-gray-600">
          Astuce {current + 1} / {safeQas.length}
        </span>

        <button
          onClick={next}
          disabled={current === safeQas.length - 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Suivant ➡️
        </button>
      </div>

      {/* 🔥 CARD */}
      <div className="bg-white shadow-xl rounded-2xl p-6">

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-2">
          {tip?.title || "Sans titre"}
        </h2>

        {/* DESCRIPTION */}
        {tip?.description && (
          <div className="prose max-w-none mb-4">
            {renderWithMath(tip.description)}
          </div>
        )}

        {/* ================= PDF ================= */}
        {tip?.pdfUrl && (
  <div className="text-center mb-6">
    <button
      onClick={() => navigate(`/student/pdf/${tip._id}`)}
      
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
    >
      📄 Voir le PDF
    </button>
  </div>
)}
        {/* ================= CASES ================= */}
        {(tip?.cases || []).length > 0 && (
          <div className="space-y-6">
            {(tip.cases || [])
              .filter(Boolean)
              .map((c, index) => (
                <div
                  key={index}
                  className="border rounded-xl p-4 bg-gray-50"
                >
                  <h3 className="font-semibold text-lg mb-2">
                    🔹 {c?.title || `Cas ${index + 1}`}
                  </h3>

                  {/* EXPLANATION */}
                  {c?.explanation && (
                    <div className="prose max-w-none mb-2">
                      {renderWithMath(c.explanation)}
                    </div>
                  )}

                  {/* EXAMPLE */}
                  {c?.example && (
                    <div className="bg-gray-200 p-3 rounded">
                      <strong>Exemple :</strong>
                      <div className="prose max-w-none">
                        {renderWithMath(c.example)}
                      </div>
                    </div>
                  )}

                  {/* ACTION */}
                  <button
                    className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    onClick={() =>
                      navigate(`/student/quiz?tip=${tip._id}&case=${index}`)
                    }
                  >
                    🧠 S’entraîner
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedQaViewer;