import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import SummaryList from "./SummaryList";
import { useNavigate } from "react-router-dom";

// Déconnexion
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("studentToken"); 
  document.cookie.split(";").forEach(function (c) {
    document.cookie =
      c.trim().split("=")[0] +
      "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }); 
  window.location.href = "/";
}

interface Student {
  _id: string;
  name: string;
  email: string;
  options?: string[];
}
interface ImportResult {
  question: string;
  status: string;
  details?: string[];
}
interface Exam {
  _id: string;
  title: string;
}

function AdminAIGenerator() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [contentType, setContentType] = useState('qcm');
  
  // 👈 NOUVEAU : Ajout du niveau académique par défaut
  const [level, setLevel] = useState('Baccalauréat Sciences Physiques'); 
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 📥 1. GÉNÉRATION : Envoie le PDF et télécharge l'Excel
  const handleGenerateExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return alert("Veuillez sélectionner un fichier PDF.");

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("subject", subject);
      formData.append("chapter", chapter);
      formData.append("type", contentType);
      formData.append("level", level); // 👈 NOUVEAU : On envoie le niveau au backend

      const response = await axios.post(`${API_BASE_URL}/api/questions/generate-from-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Generations_IA_${contentType}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      alert("Fichier Excel généré avec succès ! Il a été téléchargé sur votre ordinateur. Vous pouvez maintenant le vérifier.");
    } catch (error) {
      console.error("Erreur de génération :", error);
      alert("Une erreur est survenue lors de la génération par l'IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 📤 2. IMPORTATION : Envoie l'Excel corrigé pour sauvegarde MongoDB
  const handleImportCorrectedExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return alert("Veuillez sélectionner le fichier Excel corrigé.");

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", excelFile);

      const response = await axios.post(`${API_BASE_URL}/api/questions/import-ai-excel`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert(`Succès ! ${response.data.count} éléments corrigés ont été enregistrés dans la base de données.`);
      setExcelFile(null);
    } catch (error) {
      console.error("Erreur d'importation :", error);
      alert("Erreur lors de l'importation du fichier Excel corrigé.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      
      {/* SECTION 1 : GÉNÉRATION IA (PDF -> EXCEL) */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-indigo-600">
        <h2 className="text-2xl font-bold mb-4 text-indigo-900">
          1️⃣ Étape 1 : Générer les données avec l'IA (.xlsx)
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Sélectionnez un document PDF. L'IA analysera le contenu et vous téléchargera un fichier Excel à relire.
        </p>

        <form onSubmit={handleGenerateExcel} className="space-y-4">
          
          {/* NOUVEAU : Sélecteur de Niveau */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Niveau académique cible :</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="p-3 border rounded-xl w-full bg-indigo-50 font-semibold text-indigo-900"
            >
              <option value="Baccalauréat Sciences Physiques">Baccalauréat Sciences Physiques (PC)</option>
              <option value="Baccalauréat Sciences Mathématiques">Baccalauréat Sciences Mathématiques (SM)</option>
              <option value="Baccalauréat Sciences de la Vie et de la Terre">Baccalauréat SVT</option>
              <option value="1ère Année Baccalauréat">1ère Année Baccalauréat</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Matière (ex: Mathématique)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="p-3 border rounded-xl w-full"
              required
            />
            <input
              type="text"
              placeholder="Chapitre"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="p-3 border rounded-xl w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="p-3 border rounded-xl w-full bg-indigo"
            >
              <option value="qcm">QCM</option>
              <option value="exercise">Exercice Complexe</option>
              <option value="astuce">Astuce / Flashcard</option>
              <option value="resume">Résumé de cours</option>
              <option value="controle">Contrôle</option>
            </select>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="p-2 border rounded-xl w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isGenerating ? "🤖 Génération du fichier Excel par l'IA..." : "📥 Générer et Télécharger l'Excel"}
          </button>
        </form>
      </div>

      {/* SECTION 2 : IMPORTATION (EXCEL CORRIGÉ -> BDD) */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-green-600">
        <h2 className="text-2xl font-bold mb-4 text-green-900">
          2️⃣ Étape 2 : Importer le fichier Excel vérifié
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Une fois vos modifications et corrections terminées dans Excel, importez le fichier ici pour la sauvegarde finale.
        </p>

        <form onSubmit={handleImportCorrectedExcel} className="space-y-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            className="p-3 border rounded-xl w-full"
            required
          />

          <button
            type="submit"
            disabled={isImporting}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 transition disabled:opacity-50"
          >
            {isImporting ? "💾 Sauvegarde en BDD..." : "📤 Importer le fichier Excel corrigé"}
          </button>
        </form>
      </div>

    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("adminToken");
  const itemsPerPage = 10;

  const [activeTab, setActiveTab] = useState<"ai" | "students" | "import" | "summary">("ai");
  
  // STATE : ÉTUDIANTS
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<string[]>([]); 
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // STATE : IMPORT DES QUESTIONS EXCEL
  const [exams, setExams] = useState<Exam[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace" | "replace-global">("append");
  const [importMessage, setImportMessage] = useState<string>("");
  const [details, setDetails] = useState<ImportResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExam, setSelectedExam] = useState<string>("");
  
  // STATE : RÉSUMÉS
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);
  const [uploadPdfFile, setUploadPdfFile] = useState<File | null>(null);
  const [creationMode, setCreationMode] = useState<"text" | "upload">("text");

  // CHARGEMENT INITIAL (EFFECTS)
  const fetchStudents = async () => {
    if (!adminToken) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("❌ Erreur récupération étudiants :", err);
      setMessage("Erreur récupération étudiants");
    }
  };

  useEffect(() => {
    if (activeTab === "students") {
      if (adminToken) {
        fetchStudents();
      }
    } 
  }, [activeTab]);

  const handleOptionToggle = (option: string) => {
    setOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleCreateStudent = async () => {
    if (!name || !email || !password) {
      setMessage("⚠️ Veuillez remplir tous les champs");
      return;
    }
    if (options.length === 0) {
      setMessage("⚠️ Veuillez sélectionner au moins une option (matière)");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/create-student`,
        { name, email, password, options },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMessage("✅ Étudiant ajouté avec succès");
      setName("");
      setEmail("");
      setPassword("");
      setOptions([]); 
      fetchStudents();
    } catch (err: any) {
      console.error("❌ Création étudiant :", err);
      if (err.response?.status === 401) {
        setMessage("⛔ Session expirée. Veuillez vous reconnecter.");
      } else {
        setMessage(err.response?.data?.message || "Erreur création étudiant");
      }
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student._id);
    setName(student.name);
    setEmail(student.email);
    setOptions(student.options || []);
    setPassword(""); 
    setMessage("✏️ Mode modification activé");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStudent = async () => {
    if (!editingId) return;    
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/students/${editingId}`,
        { name, email, options },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMessage("✅ Étudiant mis à jour avec succès");
      setEditingId(null);
      setName("");
      setEmail("");
      setPassword("");
      setOptions([]);
      fetchStudents();
    } catch (err: any) {
      console.error("❌ Erreur mise à jour :", err);
      setMessage(err.response?.data?.message || "Erreur mise à jour");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Supprimer cet étudiant ?")) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setMessage(res.data.message);
      fetchStudents();
    } catch (err) {
      console.error("❌ Erreur suppression étudiant :", err);
      setMessage("Erreur suppression étudiant");
    }
  };

  // ACTIONS : IMPORT DES QUESTIONS
  const handleUpload = async () => {
    if (!file) {
      setImportMessage("⚠️ Veuillez choisir un fichier Excel.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/questions/import?mode=${mode}`,
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${adminToken}`
          } 
        }
      );
      setImportMessage(res.data.message || "✅ Import réussi");
      setDetails(res.data.details || []);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("❌ Erreur import :", error.response?.data || error.message);
      setImportMessage("❌ Erreur lors de l'import");
      setDetails([]);
    }
  };

  const totalPages = Math.ceil(details.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = details.slice(startIndex, startIndex + itemsPerPage);

  // ACTIONS : RÉSUMÉS
  const createResumeFromText = async () => {
    if (!subject || !chapter || !resumeContent) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/resume/generate`, {
        subject,
        chapter,
        content: resumeContent,
      }, {
        headers: {
          Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
        },
      });

      const finalUrl = res.data?.pdfUrl || res.data?.url;
      if (!finalUrl) return alert("Erreur : URL manquante.");
      setGeneratedPdf(finalUrl);
      alert(res.data?.alreadyExists ? "Résumé déjà existant, URL renvoyée." : "PDF généré et uploadé !");
      window.dispatchEvent(new Event("resumesUpdated"));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération.");
    }
  };

  const createResumeFromUpload = async () => {
    if (!subject || !chapter || !uploadPdfFile) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", uploadPdfFile);
      formData.append("subject", subject);
      formData.append("chapter", chapter);
      const res = await axios.post(
        `${API_BASE_URL}/api/resume/upload`,
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data", 
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined 
          } 
        }
      );
      const finalUrl = res.data?.pdfUrl || res.data?.url;
      if (!finalUrl) {
        alert("Erreur : URL non reçue après upload.");
        return;
      }
      setGeneratedPdf(finalUrl);
      alert(res.data?.alreadyExists ? "Le PDF existe déjà (URL récupérée)." : "PDF uploadé avec succès !");
      window.dispatchEvent(new Event("resumesUpdated"));

    } catch (err) {
      console.error(err);
      alert("Erreur upload PDF.");
    }
  };

  // ===============================================
  // RENDU
  // ===============================================
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center flex-1">
          👩‍🏫 Tableau de bord Enseignant
        </h1>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          🚪 Déconnexion
        </button>
      </div>

      {/* Navigation entre les onglets (BOUTONS CORRIGÉS) */}
     <div className="flex flex-wrap justify-center gap-4 mb-8">
  <button 
    onClick={() => setActiveTab("students")} 
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "students" 
        ? "!bg-blue-600 !text-white font-semibold shadow" 
        : "!bg-blue-900 !text-white hover:!bg-blue-800"
    }`}
  >
    🧑‍🎓 Gestion étudiants
  </button>

  <button 
    onClick={() => setActiveTab("import")} 
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "import" 
        ? "!bg-indigo-600 !text-white font-semibold shadow" 
        : "!bg-indigo-900 !text-white hover:!bg-indigo-800"
    }`}
  >
    📂 Import Excel
  </button>

  <button 
    onClick={() => setActiveTab("ai")} 
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "ai" 
        ? "!bg-blue-600 !text-white font-semibold shadow" 
        : "!bg-blue-900 !text-white hover:!bg-blue-800"
    }`}
  >
    🧠 Génération IA
  </button>

  <button 
    onClick={() => setActiveTab("summary")} 
    className={`px-4 py-2 rounded transition-colors ${
      activeTab === "summary" 
        ? "!bg-indigo-600 !text-white font-semibold shadow" 
        : "!bg-indigo-900 !text-white hover:!bg-indigo-800"
    }`}
  >
    📝 Gestion résumés
  </button>

  <button 
    onClick={() => navigate('/admin/upload')}
    className="!bg-blue-600 !text-white px-4 py-2 rounded shadow hover:!bg-blue-700 transition-colors"
  >
    📥 Importation Examen (Excel)
  </button>
</div>

      {/* ----------- Onglet Étudiants ----------- */}
      {activeTab === "students" && (
        <div>
          <div className="mb-6 p-4 border rounded-xl shadow-sm bg-white flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border px-3 py-2 rounded text-black flex-1 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <input
                type="email"
                placeholder="Adresse Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border px-3 py-2 rounded text-black flex-1 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              {!editingId && (
                <input
                  type="password"
                  placeholder="Mot de passe temporaire"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="border px-3 py-2 rounded text-black flex-1 focus:ring-2 focus:ring-blue-400 outline-none"
                />
              )}
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-gray-700">Options autorisées :</span>
                {["MATH", "PC", "SVT"].map((opt) => (
                  <label key={opt} className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition">
                    <input
                      type="checkbox"
                      checked={options.includes(opt)}
                      onChange={() => handleOptionToggle(opt)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium text-sm text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-2 mt-3 md:mt-0">
                {editingId ? (
                  <>
                    <button
                      onClick={handleUpdateStudent}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                    >
                      💾 Mettre à jour
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setName("");
                        setEmail("");
                        setOptions([]);
                        setMessage("");
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors font-semibold shadow-sm"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateStudent}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-semibold shadow-sm"
                  >
                    + Ajouter
                  </button>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded border font-medium ${message.includes('✅') ? 'bg-green-50 text-green-800 border-green-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
              {message}
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left">Nom</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Options</th>
                  <th className="border border-gray-300 px-4 py-3 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 px-4 py-3 font-medium">{s.name}</td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="border border-gray-300 px-4 py-3 text-blue-700 font-semibold">
                      {s.options && s.options.length > 0 ? s.options.join(", ") : "Aucune option"}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors shadow-sm"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 italic">Aucun étudiant trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------- Onglet Import Excel ----------- */}
      {activeTab === "import" && (
        <div className="bg-white p-6 rounded shadow border border-gray-200">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">📂 Importer des questions via Excel</h2>
          <p className="text-sm text-gray-500 mb-6">
            Le système lira automatiquement les matières et les concours depuis les colonnes de votre fichier Excel.
          </p>

          <div className="mb-6">
            <label className="font-semibold block mb-2 text-gray-700">⚙️ Mode de traitement des données :</label>
            <div className="flex flex-wrap gap-6 bg-gray-50/50 p-3 rounded-lg border border-dashed">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" value="append" checked={mode === "append"} onChange={() => setMode("append")} className="w-4 h-4 text-blue-600" /> 
                <span>Ajouter à la suite (append)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} className="w-4 h-4 text-blue-600" /> 
                <span>Remplacer l'identique (replace)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" value="replace-global" checked={mode === "replace-global"} onChange={() => setMode("replace-global")} className="w-4 h-4 text-blue-600" /> 
                <span>Remplacer globalement</span>
              </label>
            </div>
          </div>

          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 text-center">
            <label className="block text-sm font-semibold text-gray-700 mb-2">📄 Fichier Excel (.xlsx, .xls)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-bold text-base shadow"
          >
            🚀 Lancer l'importation du fichier
          </button>

          {importMessage && (
            <p className={`mt-4 font-semibold p-3 rounded border ${importMessage.includes('❌') || importMessage.includes('⚠️') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {importMessage}
            </p>
          )}

          {details.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">📊 Détails de l'import</h2>
              <div className="overflow-x-auto rounded shadow">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Question</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Statut</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((d, idx) => (
                      <tr key={idx} className="text-sm hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-medium">{d.question}</td>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${d.status.toLowerCase().includes('succès') || d.status === 'ok' ? 'text-green-600' : 'text-orange-600'}`}>
                          {d.status}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-600">
                          {d.details ? d.details.join(", ") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6 bg-gray-50 p-3 rounded">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                >
                  ⬅️ Précédent
                </button>
                <span className="font-semibold text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                >
                  Suivant ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------- NOUVEL ONGLET : Génération IA ----------- */}
      {activeTab === "ai" && (
        <AdminAIGenerator />
      )}

      {/* ----------- Onglet Summary ----------- */}
      {activeTab === "summary" && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-6">📝 Gestion des résumés</h2>

          <SummaryList />

          <hr className="my-8 border-gray-200" />

          <h3 className="text-xl font-bold mb-6 text-indigo-700">➕ Créer ou Importer un résumé PDF</h3>

          <div className="mb-6 flex flex-wrap gap-6 bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-indigo-600" checked={creationMode === "text"} onChange={() => setCreationMode("text")} /> 
              <span className="font-medium">Saisir du contenu (Générer PDF)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-indigo-600" checked={creationMode === "upload"} onChange={() => setCreationMode("upload")} /> 
              <span className="font-medium">Importer un fichier PDF existant</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-semibold block mb-1">Matière :</label>
              <input type="text" placeholder="Ex: Mathématiques" className="border px-3 py-2 rounded w-full" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Chapitre :</label>
              <input type="text" placeholder="Ex: Les Nombres Complexes" className="border px-3 py-2 rounded w-full" value={chapter} onChange={(e) => setChapter(e.target.value)} />
            </div>
          </div>

          {creationMode === "text" && (
            <div className="mt-4">
              <label className="font-semibold block mb-2">Contenu du résumé :</label>
              <textarea placeholder="Rédigez le résumé ici..." className="border w-full h-64 p-4 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none resize-y" value={resumeContent} onChange={(e) => setResumeContent(e.target.value)} />
              <button onClick={createResumeFromText} className="bg-green-600 text-white px-6 py-2 rounded mt-4 hover:bg-green-700 font-semibold shadow flex items-center gap-2">
                📄 Générer le PDF
              </button>
            </div>
          )}

          {creationMode === "upload" && (
            <div className="mt-4 border-2 border-dashed border-gray-300 p-8 rounded-lg text-center bg-gray-50">
              <input type="file" accept="application/pdf" onChange={(e) => setUploadPdfFile(e.target.files?.[0] || null)} className="mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4" />
              <button onClick={createResumeFromUpload} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-semibold shadow inline-flex items-center gap-2">
                📤 Uploader le PDF
              </button>
            </div>
          )}

          {generatedPdf && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded flex gap-6 items-center">
              <span className="text-green-800 font-medium">✅ Document prêt :</span>
              <a href={generatedPdf} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">
                👁️ Ouvrir le PDF
              </a>
              <a href={generatedPdf} download className="text-green-600 hover:text-green-800 underline font-medium">
                📥 Télécharger
              </a>
            </div>
          )}
        </div>
      )}

      {/* ----------- Gestion des Exercices et Astuces ----------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <button
          onClick={() => navigate("/admin/exercises")}
          className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg font-bold flex items-center justify-center gap-3"
        >
          <span className="text-2xl">📘</span> Gestion des Exercices du Soutien
        </button>

        <button
          onClick={() => navigate("/admin/astuces")}
          className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg font-bold flex items-center justify-center gap-3"
        >
          <span className="text-2xl">💡</span> Gestion des Astuces du Soutien
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;