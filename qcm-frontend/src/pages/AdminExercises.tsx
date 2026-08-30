import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import "react-quill/dist/quill.snow.css";
import RichMathEditor from "../components/RichMathEditor";

// 🔹 Interface Sous-question augmentée pour gérer le type de question et l'image
interface SubQuestion {
  _id?: string;
  questionText: string;
  qType: 'qcm' | 'vrai_faux'; 
  options: string[];
  correctAnswer: string;
  explanation: string;
  image?: string; // 👈 AJOUT DU CHAMP IMAGE
}

// 🔹 Interface Exercice
interface Exercise {
  _id: string;
  subject: string;
  chapter: string;
  contextText: string;
  contextImage?: string;
  subQuestions: SubQuestion[];
}

const emptySubQuestion: SubQuestion = {
  questionText: "",
  qType: "qcm",
  options: ["", "", "", "", ""],
  correctAnswer: "",
  explanation: "",
  image: "", // 👈 INITIALISATION DU CHAMP
};

const AdminExercises: React.FC = () => {
  // 🔹 Données
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  // 🔹 Filtres / Saisie principale
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  // 🔹 Énoncé principal
  const [contextText, setContextText] = useState("");
  const [contextImage, setContextImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 🔹 Sous-questions
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([emptySubQuestion]);

  // 📥 États dédiés à l'importation de fichiers Excel
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // =====================================================
  // 🔹 CHARGEMENT DES EXERCICES
  // =====================================================
  useEffect(() => {
    fetchExercises();
  }, []);

 const fetchExercises = async () => {
    try {
      // 🔓 CORRECTION : On pointe vers la route Admin et on force l'envoi du token Admin
      const adminToken = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE_URL}/api/exercises/admin/all`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      const data: Exercise[] = res.data;
      setExercises(data);
      const uniqueSubjects = Array.from(new Set(data.map((q) => q.subject)));
      setSubjects(uniqueSubjects);
    } catch (err) {
      console.error("❌ Erreur chargement exercices :", err);
    }
  };

  // =====================================================
  // 🔹 CHAPITRES SELON MATIÈRE
  // =====================================================
  useEffect(() => {
    if (!subject) {
      setChapters([]);
      return;
    }
    const filtered = exercises.filter((q) => q.subject === subject);
    const uniqueChapters = [...new Set(filtered.map((q) => q.chapter))];
    setChapters(uniqueChapters);
  }, [subject, exercises]);

  // =====================================================
  // 🔹 PREVIEW IMAGE
  // =====================================================
  useEffect(() => {
    if (!contextImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(contextImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [contextImage]);

  // =====================================================
  // 🔹 FILTRAGE TABLEAU
  // =====================================================
  const filteredExercises = exercises.filter((q) => {
    return (
      (subject ? q.subject === subject : true) &&
      (chapter ? q.chapter === chapter : true)
    );
  });

  // =====================================================
  // 🔹 GESTION SOUS-QUESTIONS
  // =====================================================
  const handleAddSubQuestion = () => {
    setSubQuestions([
      ...subQuestions,
      {
        questionText: "",
        qType: "qcm",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        image: "",
      },
    ]);
  };

  const handleRemoveSubQuestion = (index: number) => {
    const updated = [...subQuestions];
    updated.splice(index, 1);
    setSubQuestions(updated);
  };

  const handleSubQuestionChange = (index: number, field: keyof SubQuestion, value: string) => {
    const updated = [...subQuestions];

    // 🔄 Logique adaptative automatique si le type de question change
    if (field === "qType" && value === "vrai_faux") {
      updated[index].options = ["Vrai", "Faux"];
      updated[index].correctAnswer = ""; // On réinitialise pour forcer une sélection propre
    } else if (field === "qType" && value === "qcm") {
      updated[index].options = ["", "", "", "", ""];
      updated[index].correctAnswer = "";
    }

    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...subQuestions];
    updated[qIndex].options[optIndex] = value;
    setSubQuestions(updated);
  };

  // =====================================================
  // 🔹 VALIDATION HTML VIDE
  // =====================================================
  const isEditorEmpty = (html: string) => {
    if (html.includes('<img')) return false; // 👈 AJOUT: Ignore si contient une image manuelle
    const cleaned = html
      .replace(/<(.|\n)*?>/g, "")
      .replace(/&nbsp;/g, "")
      .trim();
    return cleaned.length === 0;
  };

  // =====================================================
  // 🔹 ACTION : INTERACTION ET IMPORTATION DU FICHIER EXCEL
  // =====================================================
  const handleExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      alert("⚠️ Veuillez sélectionner un fichier Excel (.xlsx ou .xls) au préalable.");
      return;
    }
    if (!subject || !chapter) {
      alert("⚠️ Renseignez obligatoirement la matière et le chapitre cibles ci-dessus pour y lier l'importation.");
      return;
    }

    setImporting(true);
    try {
      const adminToken = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("excelFile", excelFile);
      formData.append("subject", subject);
      formData.append("chapter", chapter);

      const res = await axios.post(`${API_BASE_URL}/api/exercises/import-excel`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(`✅ ${res.data.message}`);
      setExcelFile(null);
      // Actualisation dynamique de la liste
      fetchExercises();
    } catch (err: any) {
      console.error("Erreur lors de l'import :", err);
      alert(err.response?.data?.error || "❌ Une erreur est survenue lors de l'intégration du fichier Excel.");
    } finally {
      setImporting(false);
    }
  };

  // =====================================================
  // 🔹 SOUMISSION MANUELLE
  // =====================================================
  const handleSubmit = async () => {
    // 🔹 Vérifications principales
    if (!subject || !chapter) {
      alert("⚠️ Veuillez renseigner la matière et le chapitre.");
      return;
    }
    if (isEditorEmpty(contextText)) {
      alert("⚠️ Veuillez saisir l'énoncé principal.");
      return;
    }
    // 🔹 Vérification sous-questions
    for (let i = 0; i < subQuestions.length; i++) {
      const q = subQuestions[i];
      // ✅ question ou image obligatoire
      if (isEditorEmpty(q.questionText) && !q.image) {
        alert(`⚠️ Le texte ou l'image de la question ${i + 1} est obligatoire.`);
        return;
      }
      // ✅ Si c'est un QCM, au moins 2 options remplies
      if (q.qType === "qcm") {
        const validOptions = q.options.filter((opt) => opt.trim() !== "");
        if (validOptions.length < 2) {
          alert(`⚠️ La question ${i + 1} (QCM) doit contenir au moins 2 options.`);
          return;
        }
      }
      // ✅ bonne réponse obligatoire
      if (!q.correctAnswer.trim()) {
        alert(`⚠️ Veuillez sélectionner la bonne réponse pour la question ${i + 1}.`);
        return;
      }
    }
    try {
      const adminToken = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("chapter", chapter);
      formData.append("contextText", contextText);

      // 🔹 Nettoyage avant envoi
      const cleanedSubQuestions = subQuestions.map((q) => ({
        questionText: q.questionText.trim(),
        qType: q.qType,
        options: q.qType === "vrai_faux" ? ["Vrai", "Faux"] : q.options.filter((opt) => opt.trim() !== ""),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        image: q.image?.trim() || "", // 👈 AJOUT dans la BD
      }));

      formData.append("subQuestions", JSON.stringify(cleanedSubQuestions));

      if (contextImage) {
        formData.append("contextImage", contextImage);
      }
      await axios.post(`${API_BASE_URL}/api/exercises`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("✅ Exercice ajouté avec succès");
      
      // 🔹 Reset
      setSubject("");
      setChapter("");
      setContextText("");
      setContextImage(null);
      setPreviewUrl(null);
      setSubQuestions([
        {
          questionText: "",
          qType: "qcm",
          options: ["", "", "", ""],
          correctAnswer: "",
          explanation: "",
          image: "",
        },
      ]);

      fetchExercises();
    } catch (err) {
      console.error("❌ Erreur création exercice :", err);
      alert("❌ Erreur lors de la création de l'exercice");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ===================================================== */}
      {/* 🔹 TITRE */}
      {/* ===================================================== */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        📘 Gestion des Exercices du Soutien
      </h1>

      {/* ===================================================== */}
      {/* 🔹 BLOC DE CONFIGURATION COMMUNE (MATIÈRE / CHAPITRE) */}
      {/* ===================================================== */}
      <div className="p-4 border bg-blue-50/50 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Matière cible</label>
          <input
            type="text"
            placeholder="Matière (ex: Anatomie)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border p-3 rounded-lg w-full bg-white"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Chapitre cible</label>
          <input
            type="text"
            placeholder="Chapitre (ex: Le Système Nerveux)"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="border p-3 rounded-lg w-full bg-white"
          />
        </div>
      </div>

      {/* ===================================================== */}
      {/* 🔹 FILTRES DE VISUALISATION DU TABLEAU */}
      {/* ===================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="border p-3 rounded-lg"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>

        <select
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className="border p-3 rounded-lg"
          disabled={!subject}
        >
          <option value="">Tous les chapitres</option>
          {chapters.map((chap) => (
            <option key={chap} value={chap}>
              {chap}
            </option>
          ))}
        </select>
      </div>

      {/* ===================================================== */}
      {/* 🔹 FORMULAIRE PRINCIPAL (SAISIE + BUTTON DISCRET D'IMPORT) */}
      {/* ===================================================== */}
      <div className="mb-8 p-6 border rounded-lg shadow bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            ➕ Créer un nouvel exercice
          </h2>
          
          {/* 📥 Bouton d'importation discret intégré directement dans la ligne d'en-tête */}
          <form onSubmit={handleExcelImport} className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Ou import Excel :</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-600 max-w-[180px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            <button
              type="submit"
              disabled={importing || !excelFile}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded transition disabled:opacity-40 shadow-sm"
            >
              {importing ? "Import..." : "Lancer"}
            </button>
          </form>
        </div>

        {/* Alerte contextuelle si les informations de liaison communes sont manquantes pour l'import */}
        {excelFile && (!subject || !chapter) && (
          <div className="mb-4 p-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-medium animate-pulse">
            ⚠️ Attention : Veuillez définir une <b>Matière cible</b> et un <b>Chapitre cible</b> dans l'encart bleu tout en haut pour débloquer l'importation de votre fichier.
          </div>
        )}

        {/* ===================================================== */}
        {/* 🔹 ÉNONCÉ GLOBAL */}
        {/* ===================================================== */}
        <div className="bg-gray-50 p-5 rounded-xl border mb-8">
          <h3 className="font-bold text-lg mb-4">
            📚 Énoncé global du problème
          </h3>
          <div className="bg-white rounded-lg mb-4 text-lg">
            <RichMathEditor
              value={contextText}
              onChange={setContextText}
            />
          </div>

          {/* 🔹 Upload image */}
          <label className="font-semibold block mb-2">
            🖼 Image de l'énoncé (optionnelle)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setContextImage(e.target.files?.[0] || null)
            }
            className="mb-4"
          />

          {/* 🔹 Preview image réduite */}
          {previewUrl && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-[220px] max-h-[180px] object-contain rounded-lg border shadow-sm"
              />
            </div>
          )}
        </div>

        {/* ===================================================== */}
        {/* 🔹 SOUS-QUESTIONS */}
        {/* ===================================================== */}
        <h3 className="font-bold text-lg mb-4 text-gray-800">
          🎯 Sous-questions
        </h3>

        <div className="space-y-6 mb-6">
          {subQuestions.map((subQ, qIndex) => (
            <div
              key={qIndex}
              className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm relative"
            >
              {/* 🔹 Bouton supprimer */}
              {subQuestions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSubQuestion(qIndex)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-semibold"
                >
                  ❌ Supprimer
                </button>
              )}

              <h4 className="font-bold text-blue-700 mb-4 text-lg">
                Question {qIndex + 1}
              </h4>

              {/* 🔄 FORMAT DE QUESTION */}
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-orange-700">
                  ⚙️ Format de saisie de la question
                </label>
                <select
                  value={subQ.qType}
                  onChange={(e) => handleSubQuestionChange(qIndex, "qType", e.target.value as any)}
                  className="border p-2 rounded-lg bg-orange-50 font-medium cursor-pointer focus:ring-2 focus:ring-orange-300"
                >
                  <option value="qcm">QCM Classique (Plusieurs options)</option>
                  <option value="vrai_faux">Quiz Vrai ou Faux</option>
                </select>
              </div>

              {/* 🔹 Texte question */}
              <label className="block font-semibold mb-2">
                🧠 Texte de la question
              </label>
              <div className="mb-5 bg-white text-lg">
                <RichMathEditor
                  value={subQ.questionText}
                  onChange={(val) => handleSubQuestionChange(qIndex, "questionText", val)}
                />
              </div>

              {/* 👈 AJOUT : Champ pour le nom de l'image pour la sous question */}
              <label className="block font-semibold mb-2 text-purple-700">
                🖼️ Nom de l'image de la question (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: SVT_QCM5_Q6.png"
                value={subQ.image || ""}
                onChange={(e) => handleSubQuestionChange(qIndex, "image", e.target.value)}
                className="border p-3 rounded-lg w-full mb-5 bg-purple-50 focus:ring-2 focus:ring-purple-300"
              />

              {/* 🔹 Explication */}
              <label className="block font-semibold mb-2">
                💡 Explication pédagogique
              </label>
              <div className="mb-5 bg-white text-lg">
                <RichMathEditor
                  value={subQ.explanation}
                  onChange={(val) => handleSubQuestionChange(qIndex, "explanation", val)}
                />
              </div>

              {/* 🔹 Options adaptées selon le type choisi */}
              {subQ.qType === "qcm" ? (
                <>
                  <label className="block font-semibold mb-2">
                    📝 Options de réponse
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {subQ.options.map((opt, optIndex) => (
                      <input
                        key={optIndex}
                        type="text"
                        placeholder={`Option ${optIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="border p-3 rounded-lg w-full"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-dashed mb-5 text-gray-700 font-medium text-sm">
                  📢 Mode <b>Vrai / Faux</b> configuré. Les boutons d'options seront auto-générés pour l'étudiant.
                </div>
              )}

              {/* 🔹 Bonne réponse */}
              <label className="block font-semibold mb-2">
                ✅ Bonne réponse
              </label>
              <select
                className="border p-3 rounded-lg w-full bg-green-50 font-medium"
                value={subQ.correctAnswer}
                onChange={(e) => handleSubQuestionChange(qIndex, "correctAnswer", e.target.value)}
              >
                <option value="">Sélectionnez la bonne réponse...</option>
                {subQ.options
                  .filter((opt) => opt && opt.trim() !== "")
                  .map((opt, optIndex) => (
                    <option key={optIndex} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>

        {/* 🔹 Ajouter question */}
        <button
          onClick={handleAddSubQuestion}
          className="w-full py-3 mb-6 border-2 border-dashed border-blue-400 text-blue-600 rounded-xl hover:bg-blue-50 font-bold"
        >
          ➕ Ajouter une sous-question
        </button>

        <hr className="my-6" />

        {/* 🔹 Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white font-bold px-4 py-4 rounded-xl text-lg shadow"
        >
          ✅ Sauvegarder l'exercice complet
        </button>
      </div>

      {/* ===================================================== */}
      {/* 🔹 TABLEAU DE RESTITUTION */}
      {/* ===================================================== */}
      <table className="w-full border border-gray-300 shadow bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-3 text-left">Énoncé</th>
            <th className="border p-3">Questions</th>
            <th className="border p-3">Matière</th>
            <th className="border p-3">Chapitre</th>
          </tr>
        </thead>
        <tbody>
          {filteredExercises.map((q) => (
            <tr key={q._id} className="hover:bg-gray-50">
              <td className="border p-3">
                <div
                  dangerouslySetInnerHTML={{ __html: q.contextText }}
                  className="line-clamp-2 text-base text-gray-800"
                />
              </td>
              <td className="border p-3 text-center font-bold text-blue-600">
                {q.subQuestions?.length || 0}
              </td>
              <td className="border p-3 text-center">{q.subject}</td>
              <td className="border p-3 text-center">{q.chapter}</td>
            </tr>
          ))}

          {filteredExercises.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center p-6 text-gray-500">
                Aucun exercice trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminExercises;