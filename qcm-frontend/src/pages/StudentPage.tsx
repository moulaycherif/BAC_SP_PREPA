import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "../api/axios"; 
import { useNavigate } from "react-router-dom";
import katex from "katex";
import "katex/dist/katex.min.css";
import { API_BASE_URL } from "../config";
import { fetchAstucesByChapter } from "../api/astuces.api";
import concoursImg from "../assets/CONCOURS.jfif";
import mathsImg from "../assets/MATHS.jfif";
import physiqueImg from "../assets/PHYSIQUE.jfif";
import chimieImg from "../assets/CHIMIE.jfif";
import svtImg from "../assets/SVT.jfif";
import bgImage from "/Image3.jfif";
import StudentDashboardStats from "../components/stats/StudentDashboardStats";
import StudentAstuceDetail from "./StudentAstuceDetail";
import PdfViewer from "../components/PdfViewer";

// Indispensable pour l'interprétation globale
(window as any).katex = katex;

// --- Interfaces ---
interface Astuce {
  _id: string;
  title?: string;
  chapter?: string;
  subject?: string;
  description?: string;
  cases?: TipCase[];
  pdfUrl?: string;
}

interface TipCase {
  title?: string;
  content?: string;
  image?: string;
}

interface Question {
  _id: string;
  texte?: string;
  questionText?: string; // 👈 AJOUT
  question?: string;     // 👈 AJOUT
  image?: string | null;
  subject?: string;
  groupId?: {
    _id: string;
    image?: string | null;
    intro?: string | null;
    order?: number;
  } | null;
  options: string[];
  reponseCorrecte: string;
  note: number;
}
  const chaptersBySubject: Record<string, string[]> = {
        Mathématique: [
          "Chapitre I : Suites & Sommes",
          "Chapitre II : Etude de fonctions",
          "Chapitre III : Equations différentielles",
          "Chapitre IV : Nombres complexes",
          "Chapitre V : Intégrales",
          "Chapitre VI : Géométrie dans l'espace",
          "Chapitre VII : Probabilité",
        ],
        Physique: [
          "Chapitre I : Les ondes",
          "Chapitre II : Nucléaire",
          "Chapitre III : Electricité",
          "Chapitre IV : Lois de Newton & Théorème d'énergie cinétique",
          "Chapitre V : Système oscillant & Pendule élastique",
        ],
        Chimie: [
          "Chapitre I : Chimie des solutions",
          "Chapitre II : Cinétique chimique",
          "Chapitre III : Les piles",
          "Chapitre IV : Chimie organique",
        ],
        SVT: [
          "Chapitre 1 : Les réactions responsables de la libération de l'énergie emmagasinée dans la matière organique",
          "Chapitre 2 : Rôle du muscle strié squelettique dans la conversion de l'énergie",
          "Chapitre 3 : L'information génétique",
          "Chapitre 4 : Le génie génétique",
          "Chapitre 5 : La génétique humaine",
          "Chapitre 6 : La génétique des populations",
          "Chapitre 7 : L'immunité"
        ],
      };
// Récupération des matières de l'étudiant depuis le localStorage
const savedOptions = JSON.parse(localStorage.getItem("studentOptions") || "[]");
// Exemple : savedOptions pourrait être ["Mathématiques", "Physique-Chimie"]

export default function StudentPage() {
  const navigate = useNavigate();
  const [section, setSection] = useState<"home" | "concours" | "matiere" | "soutien" | "qcm" | "blancs">("home");
  const [blancsExams, setBlancsExams] = useState<{ _id: string; title: string }[]>([]);
  const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [currentExam, setCurrentExam] = useState<string | null>(null);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [exams, setExams] = useState<{ _id: string; title: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [id: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // États pour les exercices
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseAnswers, setExerciseAnswers] = useState<{ [id: string]: string }>({});
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
  const [exerciseScore, setExerciseScore] = useState<number | null>(null);
  const [wrongExercises, setWrongExercises] = useState<any[]>([]);
  const [exerciseAttempt, setExerciseAttempt] = useState(1);
  const [whiteExams, setWhiteExams] = useState<any[]>([]);
  
  const [astuces, setAstuces] = useState<Astuce[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any | null>(null);
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const [selectedTip, setSelectedTip] = useState<Astuce | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const matieres = ["Mathématique", "Physique", "Chimie", "SVT"];
  const isShortResume = (selectedResume?.chapter?.length ?? 0) < 30;

  const subjectImages: Record<string, string> = {
    Mathématique: mathsImg,
    Physique: physiqueImg,
    Chimie: chimieImg,
    SVT: svtImg,
  };

  const componentsOrder = [
    { key: "SVT", label: "Composante 1 : Sciences de la vie", coeff: 1 },
    { key: "Physique", label: "Composante 2 : Physique", coeff: 1 },
    { key: "Chimie", label: "Composante 3 : Chimie", coeff: 1 },
    { key: "Mathématique", label: "Composante 4 : Mathématiques", coeff: 1 }
  ];

  const [studentOptions, setStudentOptions] = useState<string[]>([]);
useEffect(() => {
  // Exemple de récupération depuis le localStorage
  const options = JSON.parse(localStorage.getItem("studentOptions") || '["MATH", "PC", "SVT"]'); 
  setStudentOptions(options);
}, []);

useEffect(() => {
  // On lit le localStorage. S'il est vide, on met un tableau vide par sécurité.
  const storedOptions = localStorage.getItem("studentOptions");
  if (storedOptions) {
    setStudentOptions(JSON.parse(storedOptions));
  }
}, []);

const getAccessibleSubjects = () => {
  let subjects: string[] = [];
  if (studentOptions.includes("MATH")) subjects.push("Mathématique");
  if (studentOptions.includes("PC")) {
    subjects.push("Physique");
    subjects.push("Chimie");
  }
  if (studentOptions.includes("SVT")) subjects.push("SVT");
  return subjects;
};

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTip(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/api/questions/exams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setExams(res.data))
      .catch((err) => console.error("❌ Exams load error", err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/api/questions/exams/blancs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setBlancsExams(res.data))
      .catch((err) => console.error("❌ Erreur chargement concours blancs", err));
  }, []);

  useEffect(() => {
    if (selectedAction !== "Résumé" || !selectedChapter) return;
    const token = localStorage.getItem("token"); 
    axios
      .get(`${API_BASE_URL}/api/resume/by-chapter/${encodeURIComponent(selectedChapter)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setResumes(res.data))
      .catch((err) => {
        console.error("❌ SUMMARY ERROR =", err);
        setResumes([]);
      });
  }, [selectedAction, selectedChapter]);

  useEffect(() => {
    if (currentExam) {
      let url = `${API_BASE_URL}/api/questions?exam=${encodeURIComponent(currentExam)}`;
      if (selectedMatiere) {
        url += `&subject=${encodeURIComponent(selectedMatiere)}`;
      }
      const token = localStorage.getItem("token");
      axios
        .get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setQuestions(res.data))
        .catch((err) => {
          console.error("❌ Erreur fetch questions:", err);
          setQuestions([]);
        });
    }
  }, [currentExam, selectedMatiere]);

  useEffect(() => {
    if (!selectedChapter) return;
    if (selectedAction === "Astuces") {
      fetchAstucesByChapter(selectedChapter)
        .then((data) => setAstuces(data as Astuce[]))
        .catch(() => setAstuces([]));
    }
  }, [selectedAction, selectedChapter]);

  useEffect(() => {
    const isExerciseAction = selectedAction === "Exercises";
    const isWhiteExamAction = selectedAction === "Astuces" && selectedMatiere === "SVT";

    if ((isExerciseAction || isWhiteExamAction) && selectedChapter && selectedMatiere) {
      const token = localStorage.getItem("token");
      const isWhiteExamParam = isWhiteExamAction ? "true" : "false";

      axios
        .get(`${API_BASE_URL}/api/exercises/${encodeURIComponent(selectedMatiere)}/${encodeURIComponent(selectedChapter)}?isWhiteExam=${isWhiteExamParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          const rawExercises = res.data || [];
          
          const normalizeForCompare = (val?: string) => {
            if (!val) return "";
            return val
              .replace(/<[^>]*>?/gm, '') 
              .replace(/&nbsp;/gi, '')   
              .replace(/\s+/g, '')       
              .toLowerCase()             
              .trim();
          };

          const groupedExercises: any[] = [];
          
          rawExercises.forEach((ex: any) => {
            const exText = normalizeForCompare(ex.contextText);
            const exImg = (ex.contextImage || "").trim();

            const existingGroup = groupedExercises.find((g) => {
              const gText = normalizeForCompare(g.contextText);
              const gImg = (g.contextImage || "").trim();
              return gText === exText && gImg === exImg;
            });
            
            if (existingGroup) {
              existingGroup.subQuestions = [
                ...existingGroup.subQuestions, 
                ...(ex.subQuestions || [])
              ];
            } else {
              groupedExercises.push({ 
                ...ex, 
                subQuestions: [...(ex.subQuestions || [])] 
              });
            }
          });

          if (isWhiteExamAction) {
            setWhiteExams(groupedExercises);
          } else {
            setExercises(groupedExercises);
          }

          setExerciseIndex(0);
          setExerciseAnswers({});
          setExerciseSubmitted(false);
          setExerciseScore(null);
        })
        .catch((err) => {
          console.error("❌ Erreur de récupération", err);
          if (isWhiteExamAction) setWhiteExams([]);
          else setExercises([]);
        });
    }
  }, [selectedAction, selectedChapter, selectedMatiere]);

  const resetQcm = () => {
    setCurrentExam(null);
    setCurrentExamId(null);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

// =========================================================================
  // 🌟 MOTEUR NATIF ULTRA-TOLÉRANT : KATEX + CORRECTION RETOURS À LA LIGNE IMAGES
  // =========================================================================
  function MixedContentRenderer({ text }: { text: string }) {
    if (!text) return null;

    // 1. Nettoyage de base + Uniformisation des espaces
    const processedText = text
      .replace(/&nbsp;/gi, " ")
      .replace(/<smiles>[\s\S]*?<\/smiles>/gi, "");

    // 2. Regex ultra-tolérante (gère les espaces et retours à la ligne autour de [[IMG=...]])
    const combinedRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<![\\<])\$[^$\n<>]+?\$|\[\[\s*IMG\s*=\s*[^\]]+\s*\]\])/gi;
    const parts = processedText.split(combinedRegex);

    return (
      <span className="w-full inline-block text-justify text-gray-800">
        {parts.map((part, index) => {
          if (!part) return null;

          const trimmedPart = part.trim();

          // 🌟 RECONNAISSANCE AMÉLIORÉE DE LA BALISE IMAGE
          if (trimmedPart.toUpperCase().startsWith("[[IMG=") && trimmedPart.endsWith("]]")) {
            // Extraction propre du nom de fichier
            const filename = trimmedPart.substring(6, trimmedPart.length - 2).trim();
            
            return (
              <span key={index} className="w-full flex justify-center my-4 block clearfix">
                <img 
                  src={`/images/${filename.replace(/^\/images\//, '')}`} 
                  alt="Illustration" 
                  className="max-h-64 object-contain rounded-lg shadow-sm border border-gray-200"
                  onError={(e) => {
                    // Optionnel : affiche un message si le fichier physique est introuvable dans /public/images/
                    console.error("Image introuvable dans le dossier public :", filename);
                  }}
                />
              </span>
            );
          }

          let isMath = false;
          let mathContent = part;
          let isBlock = false;

          // Identification des blocs Mathématiques
          if (trimmedPart.startsWith("$$") && trimmedPart.endsWith("$$")) {
            isMath = true; isBlock = true; mathContent = trimmedPart.slice(2, -2);
          } else if (trimmedPart.startsWith("\\[") && trimmedPart.endsWith("\\]")) {
            isMath = true; isBlock = true; mathContent = trimmedPart.slice(2, -2);
          } else if (trimmedPart.startsWith("\\(") && trimmedPart.endsWith("\\)")) {
            isMath = true; mathContent = trimmedPart.slice(2, -2);
          } else if (trimmedPart.startsWith("$") && trimmedPart.endsWith("$")) {
            if (!trimmedPart.includes("<") && !trimmedPart.includes(">")) {
              isMath = true; 
              mathContent = trimmedPart.slice(1, -1);
            }
          }

          if (isMath) {
            try {
              let safeMath = mathContent
                .replace(/<[^>]*>/g, "") 
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&");

              const html = katex.renderToString(safeMath, {
                displayMode: isBlock,
                throwOnError: false,
                strict: false,
              });

              return (
                <span 
                  key={index} 
                  dangerouslySetInnerHTML={{ __html: html }} 
                  className={isBlock ? "block my-2 text-center overflow-x-auto" : "inline-block"} 
                />
              );
            } catch (e) {
              return <span key={index} className="text-red-500">{part}</span>;
            }
          }

          // Rendu du texte normal et du HTML résiduel (<br>, <b>, etc.)
          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </span>
    );
  }

  // =========================================================================
  function renderContent(content?: string) {
    if (!content) return null;
    return (
      <div className="prose max-w-none text-gray-800">
        <MixedContentRenderer text={content} />
      </div>
    );
  }

  const getImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFinish = async () => {
    if (!currentExamId) return;

    let total = 0;
    questions.forEach((q) => {
      if (answers[q._id] === q.reponseCorrecte) {
        total += q.note;
      }
    });

    const totalPossiblePoints = questions.reduce((sum, q) => sum + q.note, 0);
    const totalQuestions = questions.length;
    const successRate = totalPossiblePoints > 0 ? Math.round((total / totalPossiblePoints) * 100) : 0;
    
    setScore(total);
    setSubmitted(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/student/exams/${currentExamId}/submit`,
        { answers, subject: selectedMatiere || "CONCOURS" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_BASE_URL}/api/student-activity`,
        {
          type: "QCM",
          subject: selectedMatiere || "CONCOURS",
          chapter: currentExam,
          referenceId: currentExamId,
          score: total,
          totalQuestions,
          successRate,
          examId: currentExamId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("❌ Erreur enregistrement QCM", err);
    }
  };

  const renderCenterContent = () => {
    if (selectedTipId) {
      return <StudentAstuceDetail id={selectedTipId} onBack={() => setSelectedTipId(null)} />;
    }
    
    if (section === "home") {
  const accessibleSubjects = getAccessibleSubjects();

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto">
      {accessibleSubjects.map((matiere) => (
        <div key={matiere} className="bg-white rounded-2xl shadow-lg p-6 border-l-8 border-blue-800">
          <h2 className="text-3xl font-bold text-blue-900 mb-6 border-b pb-2">
            Matière : {matiere}
          </h2>
          
          {/* Boutons d'action généraux de la matière */}
          <div className="flex gap-4 mb-6">
            <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow hover:bg-red-700 transition">
              🎥 Vidéos enregistrées
            </button>
            <button className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 transition flex items-center gap-2">
              <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
              LIVE
            </button>
          </div>

          {/* Boutons des chapitres */}
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Chapitres :</h3>
          <div className="flex flex-wrap gap-3">
            {chaptersBySubject[matiere]?.map((chapter, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedMatiere(matiere);
                  setSelectedChapter(chapter);
                  setSection("soutien"); // Cela redirigera vers l'interface existante des astuces/résumés/exos
                }}
                className="px-4 py-2 bg-blue-100 text-blue-800 font-medium rounded-lg shadow-sm hover:bg-blue-200 transition border border-blue-200"
              >
                {chapter}
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
    
    if (section === "qcm" && currentExam) {
      if (questions.length === 0) {
        return (
          <div className="text-center mt-10">
            <p className="text-gray-700 text-lg">Aucune question trouvée pour {currentExam}.</p>
          </div>
        );
      }

      const renderingBlocks = !selectedMatiere 
        ? componentsOrder.map(comp => {
            const compsQuestions = questions
              .map((q, originalIdx) => ({ q, originalIdx }))
              .filter(item => item.q.subject?.toLowerCase().startsWith(comp.key.toLowerCase().substring(0, 4)));
            return { ...comp, items: compsQuestions };
          }).filter(block => block.items.length > 0)
        : [{ label: `Questions pour la matière : ${selectedMatiere}`, coeff: null, items: questions.map((q, originalIdx) => ({ q, originalIdx })) }];

      let lastGroupId: string | null = null;

      return (
        <div className="p-4">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-900 border-b pb-2">📘 QCE — {currentExam}</h2>
          
          {renderingBlocks.map((block, bIdx) => (
            <div key={bIdx} className="mb-8">
              <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white px-4 py-3 rounded-xl font-bold shadow-md mb-4 flex justify-between items-center text-md md:text-lg">
                <span>{block.label}</span>
                {block.coeff !== null && (
                  <span className="bg-white/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
                    Coefficient : {block.coeff}
                  </span>
                )}
              </div>

              {block.items.map(({ q, originalIdx }) => {
                const isNewGroup = q.groupId?._id && q.groupId._id !== lastGroupId;
                if (q.groupId?._id) {
                  lastGroupId = q.groupId._id;
                }

                return (
                  <motion.div
                    key={q._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 mb-5 bg-white rounded-xl border-2 border-gray-950 shadow-sm"
                  >
                    {q.groupId?._id && isNewGroup && (
                      <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
                        {q.groupId?.intro && (
                          <div className="text-gray-700 font-medium text-lg mb-4 italic w-full">
                            <MixedContentRenderer text={q.groupId.intro} />
                          </div>
                        )}
                        {q.groupId?.image && (
                          <img
                            src={getImageUrl(q.groupId.image)}
                            className="max-w-lg mx-auto my-2 rounded shadow block object-contain max-h-[300px]"
                            alt="Illustration du groupe"
                          />
                        )}
                      </div>
                    )}

                    <h3 className="font-semibold mb-3 text-lg mt-1 flex items-start gap-1">
                      <span className="text-blue-900 font-bold">Q{originalIdx + 1}) </span>
                      <div className="flex-1">
                          <MixedContentRenderer text={q.texte || q.questionText || q.question || ""} /> 
                      </div>
                      <span className="text-purple-700 shrink-0 text-sm bg-purple-50 px-2 py-0.5 rounded-full font-medium">({q.note} pt)</span>
                    </h3>

                    {(!q.groupId || !q.groupId._id) && q.image && (
                      <img
                        src={getImageUrl(q.image)}
                        className="max-w-lg my-3 rounded shadow mx-auto block object-contain max-h-[300px]"
                        alt="Illustration"
                        
                      />
                    )}
                    
                    <div className="space-y-2 mt-3">
                      {q.options.map((opt, i) => {
                        return (
                          <label
  key={i}
  className={`flex items-start p-3 border-2 border-gray-300 rounded-lg cursor-pointer transition-all ${
    submitted
      ? opt === q.reponseCorrecte
        ? "bg-green-100 !border-green-500 font-medium"
        : answers[q._id] === opt
        ? "bg-red-100 !border-red-500 font-medium"
        : "opacity-60"
      : "hover:bg-blue-50/50 hover:border-blue-400"
  }`}
>
                            <input
                              type="radio"
                              name={q._id}
                              checked={answers[q._id] === opt}
                              onChange={() => handleAnswerChange(q._id, opt)}
                              disabled={submitted}
                              className="mt-1 mr-3 shrink-0 accent-blue-800"
                            />
                            <div className="flex-1 w-full text-gray-900 font-normal">
                              <MixedContentRenderer text={opt} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {!submitted ? (
            <div className="text-center mt-6">
              <button
                onClick={handleFinish}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition transform hover:scale-102"
              >
                ✅ Soumettre le sujet complet
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center text-xl font-bold text-blue-800 bg-blue-50 border border-blue-200 py-3 rounded-xl max-w-md mx-auto shadow-sm">
              🏁 Score total du concours : {score} / {questions.reduce((sum, q) => sum + q.note, 0)}
            </div>
          )}
        </div>
      );
    }

    if (section === "blancs") {
      return (
        <div className="p-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-red-700 border-b-2 border-red-200 pb-4">📝 Concours Blancs</h2>
          {blancsExams.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-500 text-lg bg-gray-50 p-8 rounded-xl border border-gray-200 inline-block shadow-sm">
                Aucun concours blanc n'est disponible pour le moment.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-6 justify-center items-start min-h-full"
            >
              {blancsExams.map((exam) => (
                <motion.div
                  key={exam._id}
                  whileHover={{ scale: 1.05 }}
                  className="relative cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-white to-gray-100 hover:from-red-50 hover:to-white transition-all border-l-4 border-red-500 w-64 h-48 flex flex-col items-center justify-center p-4 text-center"
                  onClick={() => {
                    // 1. On affiche l'objet exam complet dans la console du navigateur
  
                    resetQcm();
                    setSection("qcm");
                    // On utilise exam._id si exam.title n'existe pas
  const examName = exam.title || exam._id; 
  
  setCurrentExam(examName);
                    setCurrentExamId(exam._id);
                  }}
                >
                  <span className="text-5xl mb-4">⏱️</span>
                 <div className="font-bold text-red-800 text-lg">
  {exam.title || exam._id}
</div>
                  <div className="mt-2 text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                    Conditions réelles
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      );
    }

    if (section === "concours") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-6 justify-start items-start min-h-full"
        >
          {exams.map((exam) => (
            <motion.div
              key={exam._id}
              whileHover={{ scale: 1.05 }}
              className="relative cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/90 hover:bg-white transition-all"
              onClick={() => {
                resetQcm();
                setSection("qcm");
                setCurrentExam(exam.title);
                setCurrentExamId(exam._id);
              }}
            >
              <img src={concoursImg} className="w-48 h-48 object-cover" alt={exam.title} />
              <div className="absolute bottom-0 left-0 right-0 bg-white/60 text-black text-center py-2 font-semibold">
                {exam.title}
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    }

    if (section === "matiere" && selectedMatiere) {
      const matiereImage = subjectImages[selectedMatiere];
      const filteredExams = exams.filter((e) => e.title && e.title.startsWith("MEDECINE"));

      return (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-6 justify-start items-start min-h-full"
        >
          {filteredExams.map((exam) => (
            <motion.div
              key={exam._id}
              whileHover={{ scale: 1.05 }}
              className="relative cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/90 hover:bg-white transition-all w-48 h-48 shrink-0"
              onClick={() => {
                resetQcm();
                setSection("qcm");
                setCurrentExam(exam.title);
                setCurrentExamId(exam._id);
              }}
            >
              <img src={matiereImage} alt={`${selectedMatiere} — ${exam.title}`} className="w-full h-full object-cover" />
              <div
                className="absolute bottom-0 left-0 right-0 bg-green-700/75 text-white text-center px-1 py-1.5 font-medium text-[10px] leading-tight max-h-[44px] flex items-center justify-center overflow-hidden"
                title={`${selectedMatiere} — ${exam.title}`}
              >
                <span className="line-clamp-2 break-words">
                  {selectedMatiere} — {exam.title}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    }
      if (selectedChapter && selectedAction === "Astuces") {
        
        if (selectedMatiere === "SVT") {
          const currentEx = whiteExams[exerciseIndex];

          if (!whiteExams || whiteExams.length === 0) {
            return (
              <div className="p-6 text-center">
                <h2 className="text-3xl font-bold text-center mb-8 text-red-600">📝 {selectedChapter} — Examen blanc</h2>
                <p className="text-gray-500 bg-white p-6 rounded-xl shadow inline-block">
                  Aucun examen blanc trouvé pour ce chapitre…
                </p>
              </div>
            );
          }

          return (
            <div className="p-6 exercice-view-container">
              <style>{`
                .exercice-view-container img, .ql-editor img {
                  max-height: 260px !important;
                  width: auto !important;
                  max-width: 100% !important;
                  margin: 0 auto;
                  display: block;
                  object-fit: contain;
                  border-radius: 8px;
                }
              `}</style>

              <div className="mb-4 text-center">
                <h2 className="text-3xl font-bold mb-2 text-red-600">📝 Examen Blanc</h2>
                <p className="font-semibold text-gray-600">Question {exerciseIndex + 1} / {whiteExams.length}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow border-t-4 border-red-500">
                <div className="mb-8 border-b-2 border-gray-100 pb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide">Énoncé</h3>
                  <div className="text-lg font-medium text-gray-900">
  <MixedContentRenderer text={currentEx?.contextText || currentEx?.enonce || currentEx?.texte || ""} />
</div>
                  {currentEx?.contextImage && (
                    <img 
                      src={getImageUrl(currentEx.contextImage)} 
                      alt="Contexte Examen" 
                      className="mt-4 mx-auto block object-contain max-h-[260px]" 
                      
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {currentEx?.subQuestions?.map((subQ: any, index: number) => (
                    <div key={subQ._id} className="pl-2 border-l-2 border-red-200 py-1">
                      
                      {/* --- En-tête de la question --- */}
                      <div className="font-medium mb-2 flex flex-col items-start text-lg leading-relaxed">
                        <div className="flex items-start w-full">
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[12px] mr-2 mt-0.5 shrink-0 font-bold">
                            Q{index + 1}
                          </span>
                          <div className="flex-1 text-lg font-medium text-gray-900">
                            <MixedContentRenderer text={subQ.questionText || subQ.question || subQ.texte || ""} />
                          </div>
                        </div>

                        {/* 🖼️ IMAGE DE LA QUESTION (COMPARAISON INFAILLIBLE) */}
{subQ.image && (
  !currentEx.contextImage || 
  subQ.image.replace(/^\/images\//, '').trim() !== currentEx.contextImage.replace(/^\/images\//, '').trim()
) && (
  <div className="mt-3 w-full">
    <img 
      src={subQ.image.startsWith('/') ? subQ.image : `/images/${subQ.image.replace(/^\/images\//, '').trim()}`} 
      alt="Illustration de question" 
      className="max-h-[200px] object-contain mx-auto block rounded-lg shadow-sm border border-gray-100"
    />
  </div>
)}
                      </div>

                      {/* --- Options de réponses --- */}
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subQ.options?.map((opt: string, i: number) => {
                          const isSelected = exerciseAnswers[subQ._id] === opt;
                          const isCorrect = opt === subQ.correctAnswer;
                          
                          // Couleurs spécifiques SVT (rouge)
                          let labelClass = "hover:bg-red-50 border-gray-200";
                          if (exerciseSubmitted) {
                            if (isSelected && isCorrect) labelClass = "bg-green-100 border-green-500 shadow-sm";
                            else if (isSelected && !isCorrect) labelClass = "bg-red-100 border-red-500 shadow-sm";
                            else labelClass = "bg-gray-50 opacity-50";
                          }

                          return (
                            <label key={i} className={`flex items-start px-3 py-2 border rounded-md cursor-pointer text-base transition-all leading-snug ${labelClass}`}>
                              <input 
                                type="radio" 
                                checked={isSelected} 
                                disabled={exerciseSubmitted} 
                                onChange={() => setExerciseAnswers((prev) => ({ ...prev, [subQ._id]: opt }))} 
                                className="mt-1 mr-3 shrink-0" 
                              />
                              <div className="flex-1 w-full">
                                <MixedContentRenderer text={opt} />
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* --- Correction SVT --- */}
                      {exerciseSubmitted && exerciseAnswers[subQ._id] !== subQ.correctAnswer && (
                        <div className="ml-8 mt-2 px-3 py-2 bg-red-50 text-red-800 rounded-md border border-red-100 text-sm">  
                          <span className="font-bold flex items-center mb-1">💡 Correction :</span>
                          <div className="prose max-w-none text-gray-800">
                            <MixedContentRenderer text={subQ.explanation || ""} />
                          </div>
                        </div>
                      )}
                      
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setExerciseIndex((i) => i - 1)} disabled={exerciseIndex === 0} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">⬅️ Précédent</button>
                <button onClick={() => setExerciseIndex((i) => i + 1)} disabled={exerciseIndex === Math.max(0, whiteExams.length - 1)} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">➡️ Suivant</button>
              </div>

              {!exerciseSubmitted && (
                <button
                  onClick={async () => {
                    let score = 0;
                    let totalQuestions = 0;
                    whiteExams.forEach((ex) => {
                      ex.subQuestions?.forEach((subQ: any) => {
                        totalQuestions++;
                        if (exerciseAnswers[subQ._id] === subQ.correctAnswer) { score++; }
                      });
                    });
                    const wrong = whiteExams.filter((ex) => ex.subQuestions?.some((subQ: any) => exerciseAnswers[subQ._id] !== subQ.correctAnswer));
                    setExerciseScore(score);
                    try {
                      const token = localStorage.getItem("token");
                      await axios.post(`${API_BASE_URL}/api/student-activity`, {
                        type: "EXERCISE", 
                        subject: selectedMatiere,
                        chapter: selectedChapter,
                        score,
                        totalQuestions: whiteExams.length,
                        successRate: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
                      }, { headers: { Authorization: `Bearer ${token}` } });
                    } catch (err) { console.error(err); }
                    setExerciseSubmitted(true); setWrongExercises(wrong);
                  }}
                  className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-semibold shadow hover:bg-green-700 transition"
                >
                  ✅ Soumettre mes réponses
                </button>
              )}

              {exerciseSubmitted && (
                <div className="mt-4 text-center font-bold text-red-600 bg-red-50 py-2 rounded-xl border border-red-100">
                  Note finale de l'examen : {exerciseScore} / {whiteExams.length}
                </div>
              )}
              
              {exerciseSubmitted && wrongExercises.length > 0 && (
                <button
                  onClick={() => {
                    setExerciseAttempt((prev) => prev + 1);
                    setWhiteExams(wrongExercises); setExerciseIndex(0); setExerciseAnswers({}); setExerciseSubmitted(false); setExerciseScore(null);
                  }}
                  className="mt-4 px-6 py-2 bg-orange-500 text-white rounded w-full md:w-auto shadow hover:bg-orange-600 transition"
                >
                  🔁 Corriger mes erreurs
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="p-6 relative">
            <h2 className="text-3xl font-bold text-center mb-8">💡 {selectedChapter} — Astuces</h2>
            {astuces.length === 0 ? (
              <p className="text-center text-gray-500">Aucune astuce trouvée…</p>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {astuces.map((tip) => (
                  <motion.button
                    key={tip._id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      setSelectedTip(tip);
                      setFocusMode(true);
                      try {
                        const token = localStorage.getItem("token");
                        await axios.post(`${API_BASE_URL}/api/student-activity`, {
                          type: "ASTUCE",
                          subject: selectedMatiere,
                          chapter: selectedChapter,
                          referenceId: tip._id,
                        }, { headers: { Authorization: `Bearer ${token}` } });
                      } catch (err) { console.error(err); }
                    }}
                    className="px-5 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow transition"
                  >
                    {tip.title}
                  </motion.button>
                ))}
              </div>
            )}

            {selectedTip && (
              <motion.div
                className={`fixed inset-0 flex items-center justify-center z-50 transition ${
                  focusMode ? "bg-violet-900/80 backdrop-blur-md" : "bg-white/50 backdrop-blur-sm"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTip(null)}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden p-6 relative"
                  initial={{ scale: 0.8, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setSelectedTip(null); setFocusMode(false); }}
                    className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
                  >
                    ✖
                  </button>
                  <h2 className="text-2xl font-bold mb-4 text-center">{selectedTip.title}</h2>
                  {selectedTip?.pdfUrl && <PdfViewer key={selectedTip._id} url={selectedTip?.pdfUrl} />}
                  {!selectedTip.pdfUrl &&
                    selectedTip.cases?.map((c, i) => (
                      <div key={i} className="mb-8 overflow-y-auto max-h-[60vh]">
                        {c.title && <h3 className="font-semibold text-lg mb-2 text-indigo-700">{c.title}</h3>}
                        {c.image && (
                          <div className="flex justify-center mb-4">
                            <img 
                              src={c.image} 
                              className="max-h-72 object-contain rounded-xl shadow mx-auto" 
                              alt={c.title} 
                              
                            />
                          </div>
                        )}
                        {c.content && (
                          <div className="bg-white p-6 rounded-xl shadow">
                            {renderContent(c.content || "")}
                          </div>
                        )}
                      </div>
                    ))}
                </motion.div>
              </motion.div>
            )}
          </div>
        );
      }

      if (selectedChapter && selectedAction === "Résumé") {
        return (
          <div className="p-6 relative">
            <h2 className="text-3xl font-bold text-center mb-8">📘 {selectedChapter} — Résumés</h2>
            {resumes.length === 0 ? (
              <p className="text-center text-gray-500 font-bold">En option (sur demande)…</p>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {resumes.map((sum) => (
                  <button
                    key={sum._id}
                    onClick={async () => {
                      setSelectedResume(sum);
                      try {
                        const token = localStorage.getItem("token");
                        await axios.post(`${API_BASE_URL}/api/student-activity`, {
                          type: "RESUME",
                          subject: selectedMatiere,
                          chapter: selectedChapter,
                          referenceId: sum._id,
                        }, { headers: { Authorization: `Bearer ${token}` } });
                      } catch (err) { console.error(err); }
                    }}
                    className="px-5 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 shadow"
                  >
                    {sum.chapter}
                  </button>
                ))}
              </div>
            )}

            {selectedResume && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedResume(null)}>
                <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl ${isShortResume ? "max-h-[55vh]" : "max-h-[75vh]"} flex flex-col`}>
                  <h2 className="text-lg font-bold p-3 text-center border-b">{selectedResume.chapter}</h2>
                  <div className="flex-1 overflow-y-auto p-2">
                    <iframe src={selectedResume.pdfUrl + "#toolbar=0"} className="w-full h-full min-h-[300px] rounded-b-2xl" title="Résumé PDF" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (selectedChapter && selectedAction === "Exercises") {
        const currentEx = exercises[exerciseIndex];
        if (exercises.length === 0) {
          return <p className="text-center mt-10">Aucun exercice trouvé</p>;
        }
        const totalQuestionsCount = exercises.reduce((acc, ex) => acc + (ex.subQuestions?.length || 0), 0);
        return (
          <div className="p-6 exercice-view-container">
            <style>{`
              .exercice-view-container img, .ql-editor img {
                max-height: 260px !important;
                width: auto !important;
                max-width: 100% !important;
                margin: 0 auto;
                display: block;
                object-fit: contain;
                border-radius: 8px;
              }
            `}</style>
            
            <div className="mb-4 text-center">
              <p className="font-semibold text-gray-600">
                Énoncé {exerciseIndex + 1} / {exercises.length} <span className="text-sm font-normal">(Total : {totalQuestionsCount} questions)</span>
              </p>
            </div>
            
           <div className="bg-white p-4 rounded-xl shadow border-t-4 border-blue-600">
              
              {/* --- 1. BLOC ÉNONCÉ --- */}
              <div className="mb-4 border-b pb-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-wide">Énoncé</h3>
                <div className="text-base font-medium text-gray-800">
                  <MixedContentRenderer text={currentEx.contextText || currentEx.enonce || currentEx.texte || ""} />
                </div>
                
                {/* 🖼️ Affichage de l'image de l'énoncé (Unique et Corrigé) */}
                {currentEx.contextImage && (
                  <img 
                    src={`/images/${currentEx.contextImage.replace(/^\/images\//, '')}`} 
                    alt="Illustration de l'énoncé" 
                    className="max-h-48 block mx-auto my-5 rounded-lg shadow-sm border border-gray-200" 
                    
                  />
                )}
              </div>
              
              {/* --- 2. BLOC QUESTIONS --- */}
              <div className="space-y-6">
                {currentEx.subQuestions?.map((subQ: any, index: number) => (
                  <div key={subQ._id} className="pl-2 border-l-2 border-blue-200 py-1">
                    
                    <div className="font-medium mb-2 flex flex-col items-start text-lg leading-relaxed">
                      
                      <div className="flex items-start w-full">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[12px] mr-2 mt-0.5 shrink-0 font-bold">
                          Q{index + 1}
                        </span>
                        <div className="flex-1 text-lg font-medium text-gray-900">
                          <MixedContentRenderer text={subQ.questionText || subQ.question || subQ.texte || ""} />
                        </div>
                      </div>

                      {/* 🖼️ IMAGE DE LA QUESTION (COMPARAISON INFAILLIBLE) */}
{subQ.image && (
  !currentEx.contextImage || 
  subQ.image.replace(/^\/images\//, '').trim() !== currentEx.contextImage.replace(/^\/images\//, '').trim()
) && (
  <div className="mt-3 w-full">
    <img 
      src={subQ.image.startsWith('/') ? subQ.image : `/images/${subQ.image.replace(/^\/images\//, '').trim()}`} 
      alt="Illustration de question" 
      className="max-h-[200px] object-contain mx-auto block rounded-lg shadow-sm border border-gray-100"
    />
  </div>
)}
                    </div>
                    
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subQ.options.map((opt: string, i: number) => {
                        const isSelected = exerciseAnswers[subQ._id] === opt;
                        const isCorrect = opt === subQ.correctAnswer;
                        return (
                          <label key={i} className={`flex items-start px-3 py-2 border rounded-md cursor-pointer text-base transition-all leading-snug ${exerciseSubmitted ? isSelected && isCorrect ? "bg-green-100 border-green-500 shadow-sm" : isSelected && !isCorrect ? "bg-red-100 border-red-500 shadow-sm" : "bg-gray-50 opacity-50" : "hover:bg-red-50 border-gray-200"}`}>
                            <input type="radio" checked={isSelected} disabled={exerciseSubmitted} onChange={() => setExerciseAnswers((prev) => ({ ...prev, [subQ._id]: opt }))} className="mt-1 mr-3 shrink-0" />
                            <div className="flex-1 w-full">
                              <MixedContentRenderer text={opt} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    
                    {exerciseSubmitted && exerciseAnswers[subQ._id] !== subQ.correctAnswer && (
                      <div className="ml-8 mt-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-md border border-blue-100 text-sm">  
                        <span className="font-bold flex items-center mb-1">💡 Correction :</span>
                        <div className="prose max-w-none text-gray-800">
                          <MixedContentRenderer text={subQ.explanation || ""} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <button onClick={() => setExerciseIndex((i) => i - 1)} disabled={exerciseIndex === 0} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 font-semibold">⬅️ Énoncé Précédent</button>
              <button onClick={() => setExerciseIndex((i) => i + 1)} disabled={exerciseIndex === Math.max(0, exercises.length - 1)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 font-semibold">Énoncé Suivant ➡️</button>
            </div>
            
            {!exerciseSubmitted && (
              <button
                onClick={async () => {
                  let score = 0;
                  let totalQ = 0;
                  exercises.forEach((ex) => {
                    ex.subQuestions?.forEach((subQ: any) => {
                      totalQ++;
                      if (exerciseAnswers[subQ._id] === subQ.correctAnswer) { score++; }
                    });
                  });
                  const wrong = exercises.filter((ex) => ex.subQuestions?.some((subQ: any) => exerciseAnswers[subQ._id] !== subQ.correctAnswer));
                  setExerciseScore(score);
                  try {
                    const token = localStorage.getItem("token");
                    await axios.post(`${API_BASE_URL}/api/student-activity`, {
                      type: "EXERCISE",
                      subject: selectedMatiere,
                      chapter: selectedChapter,
                      score,
                      totalQuestions: totalQ,
                      successRate: totalQ > 0 ? Math.round((score / totalQ) * 100) : 0,
                    }, { headers: { Authorization: `Bearer ${token}` } });
                  } catch (err) { console.error(err); }
                  setExerciseSubmitted(true); setWrongExercises(wrong);
                }}
                className="mt-6 px-6 py-2 bg-green-600 text-white rounded font-bold w-full md:w-auto shadow"
              >
                ✅ Valider ce chapitre
              </button>
            )}

            {exerciseSubmitted && (
              <div className="mt-4 text-center font-bold text-blue-700 bg-blue-50 py-3 rounded-lg border border-blue-200">
                Score : {exerciseScore} / {totalQuestionsCount} ({exerciseAttempt === 1 ? "1er essai" : `${exerciseAttempt}ème essai`})
              </div>
            )}
            {exerciseSubmitted && wrongExercises.length > 0 && (
              <button
                onClick={() => {
                  setExerciseAttempt((prev) => prev + 1);
                  setExercises(wrongExercises); 
                  setExerciseIndex(0); 
                  setExerciseAnswers({}); 
                  setExerciseSubmitted(false); 
                  setExerciseScore(null);
                }}
                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded w-full md:w-auto font-bold shadow"
              >
                🔁 Refaire uniquement les énoncés avec erreurs
              </button>
            )}
          </div>
        );
      }

     if (selectedChapter) {
        const actions = [
          { 
            label: selectedMatiere === "SVT" ? "📝 Examen blanc" : "💡 Astuces", 
            value: "Astuces",
            color: selectedMatiere === "SVT" ? "bg-red-400 text-white" : "bg-yellow-400 text-black" 
          },
          { label: "📘 Résumé", value: "Résumé", color: "bg-blue-400 text-black" },
          { label: "🧩 Exercises", value: "Exercises", color: "bg-green-400 text-black" },
        ];

        return (
          <div className="flex flex-col items-center justify-center gap-8 mt-20">
            <h2 className="text-2xl font-bold text-gray-800 text-center max-w-2xl px-4">{selectedChapter}</h2>
            <div className="flex gap-8">
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAction(action.value)}
                  className={`${action.color} font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-2xl transition`}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        );
      }

      // 🎯 Rendu par défaut si aucune condition n'est remplie
      return <StudentDashboardStats />;
      
  }; // 👈 L'ACCOLADE EST ICI : Elle ferme PROPREMENT renderCenterContent !


  // 1️⃣ NOUVELLE FONCTION DE NAVIGATION PAR ÉTAPES
  const handleRetourArriere = () => {
    if (selectedTipId) {
      setSelectedTipId(null);
      return;
    }
    if (selectedAction) {
      setSelectedAction(null);
      return;
    }
    if (selectedChapter) {
      setSelectedChapter(null);
      setSelectedMatiere(null); // Retourne à l'accueil global
      setSection("home");
      return;
    }
    if (section === "qcm") {
      resetQcm();
      setSection("home");
      return;
    }
    if (section !== "home") {
      setSelectedMatiere(null);
      setSection("home");
      return;
    }
  };

  // 2️⃣ LE RENDU PRINCIPAL DU COMPOSANT (Celui qui englobe toute la page)
  return (
    <div
      className="h-screen w-screen flex text-black overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        className="flex-1 h-full bg-white/80 backdrop-blur-md shadow-lg p-4 overflow-y-auto relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {(section !== "home" || selectedMatiere || selectedChapter || selectedAction || selectedTipId) && (
          <button
            onClick={handleRetourArriere}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition z-10 font-semibold shadow-md"
          >
            🔙 Retour
          </button>
        )}

        {renderCenterContent()}
      </motion.div>
    </div>
  );
} // 👈 ET CELLE-CI FERME LE COMPOSANT STUDENTPAGE