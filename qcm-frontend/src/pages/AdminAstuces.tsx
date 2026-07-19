import React, { useEffect, useState } from "react";
import axios from "../api/axios"; 
import { API_BASE_URL } from "../config";
import RichMathEditor from "../components/RichMathEditor";
import "react-quill/dist/quill.snow.css";

/* ===================== TYPES ===================== */

interface TipCase {
  title?: string;
  content?: string;
  explanation?: string;
  example?: string;
  image?: string; 
}

interface Tip {
  _id: string;
  subject: string;
  chapter: string;
  title: string;
  description?: string;
  cases: TipCase[];
  pdfUrl?: string;
}

/* ===================== COMPONENT ===================== */

const AdminAstuces: React.FC = () => {
  /* 🔥 MODE */
  const [mode, setMode] = useState<"pdf" | "manual">("pdf");

  /* 🔥 PDF */
  const [pdfUrl, setPdfUrl] = useState("");

  /* 🔥 DATA */
  const [tips, setTips] = useState<Tip[]>([]);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);

  const [cases, setCases] = useState<TipCase[]>([
    { title: "", content: "" },
  ]);

  const addCase = () => {
    setCases((prev) => [
      ...prev,
      { title: "", content: "", image: "" }
    ]);
  };

  const removeCase = (index: number) => {
    setCases((prev) => prev.filter((_, i) => i !== index));
  };

  /* ===================== RESET MODE ===================== */

  useEffect(() => {
    if (mode === "pdf") {
      setCases([{ title: "", content: "" }]);
    }
  }, [mode]);

  /* ===================== FETCH ===================== */

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/astuces`);

      const safeData = res.data.map((tip: any) => ({
        ...tip,
        cases: tip.cases || [],
      }));

      setTips(safeData);
    } catch (err) {
      console.error("❌ Erreur chargement astuces :", err);
    }
  };

  /* ===================== PDF UPLOAD ===================== */

  const handlePdfUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/astuces/upload-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPdfUrl(res.data.pdfUrl);

      alert("✅ PDF uploadé avec succès !");
    } catch (err) {
      console.error("❌ Erreur upload PDF :", err);
      alert("Erreur upload PDF");
    }
  };

  const handleImageUpload = async (e: any, index: number) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/astuces/upload-image`,
        formData
      );

      const imageUrl = res.data.imageUrl;

      setCases((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          image: imageUrl,
        };
        return updated;
      });

    } catch (err) {
      console.error("❌ upload image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  /* ===================== CASES ===================== */

  const updateCase = (
    index: number,
    field: keyof TipCase,
    value: string
  ) => {
    setCases((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  /* ===================== VALIDATION HTML VIDE ===================== */
  
  const isEditorEmpty = (html?: string) => {
    if (!html) return true;
    const cleaned = html
      .replace(/<(.|\n)*?>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();
    return cleaned.length === 0;
  };

  /* ===================== CREATE ===================== */

  const createTip = async () => {
    const casesCopy = [...cases]; 

    const cleanCases = casesCopy.filter(
      (c) =>
        !isEditorEmpty(c.content) ||
        (c.image && c.image.trim() !== "")
    );

    await axios.post(`${API_BASE_URL}/api/astuces`, {
      subject,
      chapter,
      title,
      description,
      cases: mode === "manual" ? cleanCases : [],
      pdfUrl,
    });

    setSubject("");
    setChapter("");
    setTitle("");
    setDescription("");
    setPdfUrl("");
    setCases([{ title: "", content: "", image: "" }]);
    
    alert("✅ Astuce enregistrée avec succès !");
    fetchTips(); 
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        💡 Gestion des Astuces du Soutien
      </h1>

      {/* 🚨 NOUVEAU BANDEAU D'INFORMATION DYNAMIQUE POUR L'ADMINISTRATEUR */}
      {subject.trim().toUpperCase() === "SVT" && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col gap-1 shadow-sm">
          <span className="text-sm font-bold text-orange-800 flex items-center gap-2">
            💡 Info Importation SVT :
          </span>
          <p className="text-xs text-orange-700 leading-relaxed">
            Pour ajouter un cours classique (Manuel ou PDF), utilisez cette page. Cependant, si vous souhaitez importer un <b>fichier Excel d'Examen Blanc QCM</b>, vous devez aller sur l'onglet <b>📘 Gestion des Exercices</b>, y taper SVT et cocher la case d'examen blanc. Les deux apparaîtront ensemble dans l'espace Astuces de l'étudiant.
          </p>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-2xl p-6 mb-12">

        {/* 🔥 MODE SWITCH */}
        <div className="mb-6">
          <button
            onClick={() => setMode("pdf")}
            className={`mr-2 px-4 py-2 rounded ${
              mode === "pdf" ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            📄 PDF
          </button>

          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded ${
              mode === "manual" ? "bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            ✍️ Manuel
          </button>
        </div>

        {/* ================= PDF ================= */}
        {mode === "pdf" && (
          <div className="mb-6">
            <label className="block mb-2 font-semibold">
              📄 Importer un PDF
            </label>

            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="border p-2 rounded-lg"
            />

            {pdfUrl && (
              <p className="text-green-600 mt-2">
                ✅ PDF prêt à être enregistré
              </p>
            )}
          </div>
        )}

        {/* ================= INFOS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Matière"
            className="border p-3 rounded-lg"
          />

          <input
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="Chapitre"
            className="border p-3 rounded-lg"
          />
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          className="border p-3 rounded-lg w-full mb-4"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border p-3 rounded-lg w-full mb-6"
        />

        {/* ================= MANUAL ================= */}
        {mode === "manual" && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Cas / Astuces
            </h2>

            {cases.map((c, index) => (
              <div key={index} className="border p-4 mb-4 rounded-lg bg-gray-50">
                <label className="block font-semibold mb-1">Titre du cas</label>
                <input
                  value={c.title}
                  onChange={(e) =>
                    updateCase(index, "title", e.target.value)
                  }
                  className="border p-2 w-full mb-4 rounded bg-white"
                  placeholder="Ex: Astuce n°1..."
                />

                <label className="block font-semibold mb-1">Image associée (Optionnelle)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mb-4"
                  onChange={(e) => {
                    if (!e.target.files?.length) return;
                    handleImageUpload(e, index);
                  }}
                />

                {c.image && (
                  <div className="mb-4">
                    <img src={c.image} className="rounded max-h-40 border shadow-sm" alt="Aperçu" />
                  </div>
                )}

                <label className="block font-semibold mb-2">Contenu textuel (Reconnaît Word et LaTeX)</label>
                <div className="bg-white rounded-lg mb-2">
                  <RichMathEditor
                    value={c.content || ""}
                    onChange={(html) =>
                      updateCase(index, "content", html)
                    }
                  />
                </div>

                {cases.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeCase(index)}
                      className="text-red-500 hover:text-red-700 font-semibold mt-2"
                    >
                      ❌ Supprimer ce cas
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button 
              onClick={addCase} 
              className="w-full py-3 mb-6 border-2 border-dashed border-indigo-400 text-indigo-600 rounded-xl hover:bg-indigo-50 font-bold"
            >
              ➕ Ajouter un autre cas
            </button>
          </>
        )}

        {/* ================= SAVE ================= */}
        <button
          onClick={createTip}  
          disabled={uploadingImage}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold px-4 py-4 rounded-xl text-lg shadow disabled:opacity-50"
        >
          💾 Enregistrer l'astuce
        </button>
      </div>

      {/* ================= LIST ================= */}
      <h2 className="text-2xl mb-4">📚 Astuces existantes</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {tips.map((tip) => {
          const hasPDF = !!tip.pdfUrl;
          const hasImage = tip.cases?.some((c) => c.image);
          const hasText = tip.cases?.some((c) => c.content && !isEditorEmpty(c.content));

          return (
            <div
              key={tip._id}
              className="border p-4 rounded-xl shadow hover:shadow-lg transition bg-white"
            >
              <div className="text-sm text-gray-500 font-semibold">
                {tip.subject} — {tip.chapter}
              </div>

              <h3 className="font-bold text-lg mt-1">{tip.title}</h3>

              <div className="mt-3 flex gap-2">
                {hasPDF && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    📄 PDF
                  </span>
                )}

                {!hasPDF && hasImage && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                    🖼️ Image
                  </span>
                )}

                {!hasPDF && !hasImage && hasText && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                    ✍️ Texte Riche
                  </span>
                )}
              </div>

              {!hasPDF && !hasImage && hasText && (
                <div
                  className="mt-4 text-gray-700 text-sm line-clamp-3 bg-gray-50 p-2 rounded border"
                  dangerouslySetInnerHTML={{
                    __html: tip.cases[0]?.content || "",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminAstuces;