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
import physique_chimieImg from "../assets/PHYSIQUE-CHIMIE.jpg";
import svtImg from "../assets/SVT.jfif";
import bgImage from "/Image3.jfif";
import StudentDashboardStats from "../components/stats/StudentDashboardStats";
import StudentAstuceDetail from "./StudentAstuceDetail";
import PdfViewer from "../components/PdfViewer";
import React from 'react';

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
  questionText?: string;
  question?: string;
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
    "Chapitre I : Limites et Continuité",
    "Chapitre II : Dérivation et étude de fonctions",
    "Chapitre III : Suites numériques",
    "Chapitre IV : Fonctions primitives",
    "Chapitre V : Fonctions logarithmiques",
    "Chapitre VI : Nombres complexes (Partie 1)",
    "Chapitre VII : Fonctions exponentielles",
    "Chapitre VIII : Nombres complexes (Partie 2)",
    "Chapitre IX : Calcul intégral",
    "Chapitre X : Equations différentielles",
    "Chapitre XI : Produit scalaire et produit vectoriel dans l'espace",
    "Chapitre XII : Dénombrement et probabilités"
  ],
  Physique: [
    "CHAPITRE 1 : Ondes mécaniques progressives",
    "CHAPITRE 2 : Ondes mécaniques progressives périodiques",
    "CHAPITRE 3 : Propagation d’une onde lumineuse",
    "CHAPITRE 4 : Décroissance radioactive",
    "CHAPITRE 5 : Noyaux, masse et énergie",
    "CHAPITRE 6 : Dipôle RC",
    "CHAPITRE 7 : Dipôle RL",
    "CHAPITRE 8 : Oscillations libres d'un circuit RLC série",
    "CHAPITRE 9 : Ondes électromagnétiques",
    "CHAPITRE 10 : Modulation d'amplitude",
    "CHAPITRE 11 : Lois de Newton",
    "CHAPITRE 12 : Chute verticale d'un corps solide",
    "CHAPITRE 13 : Mouvements plans",
    "CHAPITRE 14 : Mouvement des satellites et des planètes",
    "CHAPITRE 15 : Mouvement de rotation d’un solide autour d’un axe fixe",
    "CHAPITRE 16 : Système mécanique oscillant",
    "CHAPITRE 17 : Aspects énergétiques",
    "CHAPITRE 18 : Atome et mécanique de Newton"
  ],
  Chimie: [
    "Chapitre 1 : Transformations lentes et transformations rapides",
    "Chapitre 2 : Suivi temporel d'une transformation chimique - Vitesse de réaction",
    "Chapitre 3 : Transformations chimiques s'effectuant dans les 2 sens",
    "Chapitre 4 : État d'équilibre d'un système chimique",
    "Chapitre 5 : Transformations associées à des réactions acido-basiques en solution aqueuse",
    "Chapitre 6 : Évolution spontanée d'un système chimique",
    "Chapitre 7 : Transformations spontanées dans les piles et production d'énergie",
    "Chapitre 8 : Transformations forcées (Électrolyse)",
    "Chapitre 9 : Réactions d'estérification et d'hydrolyse",
    "Chapitre 10 : Contrôle de l'évolution d'un système chimique"
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

  const [controles, setControles] = useState<any[]>([]);

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
    try {
      const storedOptions = localStorage.getItem("studentOptions");
      if (storedOptions && storedOptions !== "undefined") {
        const parsed = JSON.parse(storedOptions);
        if (Array.isArray(parsed)) {
          setStudentOptions(parsed);
        } else {
          setStudentOptions([parsed]); 
        }
      } else {
        setStudentOptions([]);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la lecture des options :", error);
      setStudentOptions([]);
    }
  }, []);

  const getAccessibleSubjects = () => {
    let subjects: string[] = [];
    const safeOptions = Array.isArray(studentOptions) ? studentOptions : [];

    if (safeOptions.includes("MATH")) subjects.push("Mathématique");
    if (safeOptions.includes("PC")) {
      subjects.push("Physique-Chimie");
    }
    if (safeOptions.includes("SVT")) subjects.push("SVT");
    
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
    if (!selectedChapter || !selectedAction || !selectedMatiere) return;

    const loadHybridContent = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const safeMatiere = encodeURIComponent(selectedMatiere);
      const safeChapter = encodeURIComponent(selectedChapter);

      if (selectedAction === "Résumé") {
        let manualData: any[] = [], aiData: any[] = [];
        try {
          const resManual = await axios.get(`${API_BASE_URL}/api/resume/by-chapter/${safeChapter}`, { headers });
          manualData = resManual.data || [];
        } catch (err) { console.error("Erreur Résumés manuels", err); }

        try {
          const resAi = await axios.get(`${API_BASE_URL}/api/questions?subject=${safeMatiere}&chapter=${safeChapter}&type=resume`, { headers });
          aiData = resAi.data || [];
        } catch (err) { console.error("Erreur Résumés IA", err); }

        setResumes([...manualData, ...aiData]);
      }
      else if (selectedAction === "Astuces") {
        const isWhiteExamAction = selectedMatiere === "SVT";

        if (isWhiteExamAction) {
          try {
            const res = await axios.get(`${API_BASE_URL}/api/exercises/${safeMatiere}/${safeChapter}?isWhiteExam=true`, { headers });
            const rawExercises = res.data || [];
            
            const normalizeForCompare = (val?: string) => val ? val.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/gi, '').replace(/\s+/g, '').toLowerCase().trim() : "";
            const groupedExercises: any[] = [];
            rawExercises.forEach((ex: any) => {
              const exText = normalizeForCompare(ex.contextText);
              const exImg = (ex.contextImage || "").trim();
              const existingGroup = groupedExercises.find((g) => normalizeForCompare(g.contextText) === exText && (g.contextImage || "").trim() === exImg);
              
              if (existingGroup) existingGroup.subQuestions = [...existingGroup.subQuestions, ...(ex.subQuestions || [])];
              else groupedExercises.push({ ...ex, subQuestions: [...(ex.subQuestions || [])] });
            });
            setWhiteExams(groupedExercises);
          } catch (err) { setWhiteExams([]); }
        } else {
          let manualData: Astuce[] = [], aiData: Astuce[] = [];
          
          try {
            const data = await fetchAstucesByChapter(selectedChapter);
            manualData = (data as Astuce[]) || [];
          } catch (err) { console.error("Erreur Astuces", err); }
          
          try {
            const resAi = await axios.get(`${API_BASE_URL}/api/questions?subject=${safeMatiere}&chapter=${safeChapter}&type=astuce`, { headers });
            const rawAiData = resAi.data || [];
            
            aiData = rawAiData.map((q: any) => ({
              _id: q._id,
              title: q.texte || "Astuce générée par IA", 
              subject: q.subject,
              chapter: q.chapter,
              cases: [
                {
                  title: "Explication de l'IA",
                  content: q.explication || "Aucune explication fournie."
                }
              ]
            }));
          } catch (err) { console.error("Erreur Astuces IA", err); }
          
          setAstuces([...manualData, ...aiData]);
        }
      }
      else if (selectedAction === "Exercises" || selectedAction === "Exercices" || selectedAction === "QCM") {
        let manualExercises: any[] = [], aiExercises: any[] = [];

        try {
          const res = await axios.get(`${API_BASE_URL}/api/exercises/${safeMatiere}/${safeChapter}?isWhiteExam=false`, { headers });
          const rawExercises = res.data || [];
          
          const normalizeForCompare = (val?: string) => val ? val.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/gi, '').replace(/\s+/g, '').toLowerCase().trim() : "";
          const groupedExercises: any[] = [];
          rawExercises.forEach((ex: any) => {
            const exText = normalizeForCompare(ex.contextText);
            const exImg = (ex.contextImage || "").trim();
            const existingGroup = groupedExercises.find((g) => normalizeForCompare(g.contextText) === exText && (g.contextImage || "").trim() === exImg);
            
            if (existingGroup) existingGroup.subQuestions = [...existingGroup.subQuestions, ...(ex.subQuestions || [])];
            else groupedExercises.push({ ...ex, subQuestions: [...(ex.subQuestions || [])] });
          });
          manualExercises = groupedExercises;
        } catch (err) { console.error("Erreur Exercices Manuels", err); }

        try {
          const [resAiQcm, resAiExo] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/questions?subject=${safeMatiere}&chapter=${safeChapter}&type=qcm`, { headers }),
            axios.get(`${API_BASE_URL}/api/questions?subject=${safeMatiere}&chapter=${safeChapter}&type=exercise`, { headers })
          ]);
          
          const aiData = [...(resAiQcm.data || []), ...(resAiExo.data || [])];
          
          if (aiData.length > 0) {
            const aiSubQuestions = aiData.map((q: any) => ({
              _id: q._id,
              questionText: q.texte || q.questionText || q.question,
              qType: q.type === 'exercise' ? 'open' : 'qcm', 
              options: q.options || [],
              correctAnswer: q.reponseCorrecte,
              explanation: q.explication,
              image: q.image
            }));

            aiExercises = [{
              _id: "ia-group-" + Date.now(),
              contextText: "🧠 Questions d'entraînement (QCM & Exercices générés par l'IA)", 
              subQuestions: aiSubQuestions
            }];
          }
        } catch (err) { console.error("Erreur Exercices IA", err); }

        setExercises([...manualExercises, ...aiExercises]);
        setExerciseIndex(0);
        setExerciseAnswers({});
        setExerciseSubmitted(false);
        setExerciseScore(null);
      }
      else if (selectedAction === "Controles") {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/questions?subject=${safeMatiere}&chapter=${safeChapter}&type=controle`, { headers });
          setControles(res.data || []);
        } catch (err) { 
          console.error("Erreur lors de la récupération des contrôles", err); 
          setControles([]);
        }
      }
    };

    loadHybridContent();
  }, [selectedAction, selectedChapter, selectedMatiere]);

  const resetQcm = () => {
    setCurrentExam(null);
    setCurrentExamId(null);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  function MixedContentRenderer({ text }: { text: string }) {
    if (!text) return null;

    const processedText = text
      .replace(/&nbsp;/gi, " ")
      .replace(/<smiles>[\s\S]*?<\/smiles>/gi, "");

    const combinedRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\\\\[[\s\S]*?\\\\\]|\\\\\([\s\S]*?\\\\\)|(?<![\\<])\$[^$]+?\$|\[\[\s*IMG\s*=\s*[^\]]+\s*\]\])/gi;
    const parts = processedText.split(combinedRegex);

    return (
      <span className="w-full inline-block text-justify text-gray-800">
        {parts.map((part, index) => {
          if (!part) return null;

          const trimmedPart = part.trim();

          if (trimmedPart.toUpperCase().startsWith("[[IMG=") && trimmedPart.endsWith("]]")) {
            const filename = trimmedPart.substring(6, trimmedPart.length - 2).trim();
            
            return (
              <span key={index} className="w-full flex justify-center my-4 block clearfix">
                <img 
                  src={`/images/${filename.replace(/^\/images\//, '')}`} 
                  alt="Illustration" 
                  className="max-h-64 object-contain rounded-lg shadow-sm border border-gray-200"
                />
              </span>
            );
          }

          let isMath = false;
          let mathContent = part;
          let isBlock = false;

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

          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </span>
    );
  }
 
  const Flashcard = ({ title, content }: { title: string, content: string }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
      <div 
        className="relative w-full h-80 cursor-pointer group"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className="relative w-full h-full transition-transform duration-700 ease-in-out"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          <div 
            className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center text-white border-2 border-indigo-400 hover:shadow-2xl transition-shadow"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-4xl mb-4 block">💡</span>
            <h3 className="text-2xl font-bold leading-tight">
              <MixedContentRenderer text={title} />
            </h3>
            <p className="absolute bottom-5 text-indigo-200 text-sm font-medium animate-pulse">
              Cliquez pour retourner ↺
            </p>
          </div>

          <div 
            className="absolute w-full h-full bg-white rounded-2xl shadow-xl p-6 overflow-y-auto flex items-center justify-center border-4 border-indigo-100 custom-scrollbar"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-gray-800 text-lg font-medium w-full text-left">
              <MixedContentRenderer text={content} />
            </div>
          </div>
        </div>
      </div>
    );
  };

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
    
    if (section === "home" && !selectedAction) {
      const accessibleSubjects = getAccessibleSubjects();

      if (accessibleSubjects.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-red-500 max-w-lg">
              <span className="text-5xl block mb-4">⚠️</span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune option configurée</h2>
              <p className="text-gray-600 mb-6">
                Votre compte n'a actuellement accès à aucune matière (MATH, PC ou SVT). 
                Veuillez demander à un administrateur de configurer vos options d'études.
              </p>
            </div>
          </div>
        );
      }

      const renderChapterAccordion = (chapter: string, matiereAPI: string, matiereAffichage: string) => {
        const isExpanded = selectedChapter === chapter && selectedMatiere === matiereAPI;
        return (
          <div key={`${matiereAPI}-${chapter}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
            <button
              onClick={() => {
                setSelectedMatiere(matiereAPI);
                setSelectedChapter(isExpanded ? null : chapter);
                setSelectedAction(null); 
              }}
              className={`w-full text-left p-5 text-lg font-semibold transition-colors flex justify-between items-center ${
                isExpanded ? "bg-blue-800 text-white" : "bg-white hover:bg-gray-50 text-gray-800"
              }`}
            >
              <span className={chapter === "Toute l'épreuve" ? "text-purple-300 font-extrabold flex items-center gap-2" : ""}>
                {chapter === "Toute l'épreuve" && "🏆 "} {chapter}
              </span>
              <span className="text-xl">{isExpanded ? "🔽" : "▶️"}</span>
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-wrap gap-4 p-5 bg-blue-50 border-t-2 border-blue-100"
              >
                <button onClick={() => setSelectedAction("Exercises")} className="flex-1 min-w-[200px] bg-white border border-blue-200 text-blue-800 px-4 py-3 rounded-xl shadow hover:bg-blue-100 hover:border-blue-400 font-bold transition flex flex-col items-center gap-2">
                  <span className="text-2xl">📝</span> QCM & Exercices
                </button>
                <button onClick={() => setSelectedAction("Astuces")} className="flex-1 min-w-[200px] bg-white border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl shadow hover:bg-yellow-50 hover:border-yellow-400 font-bold transition flex flex-col items-center gap-2">
                  <span className="text-2xl">💡</span> Astuces
                </button>
                <button onClick={() => setSelectedAction("Résumé")} className="flex-1 min-w-[200px] bg-white border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow hover:bg-green-50 hover:border-green-400 font-bold transition flex flex-col items-center gap-2">
                  <span className="text-2xl">📄</span> Fiches ou Résumés
                </button>
                <button onClick={() => setSelectedAction("Controles")} className="flex-1 min-w-[200px] bg-white border border-purple-200 text-purple-700 px-4 py-3 rounded-xl shadow hover:bg-purple-50 hover:border-purple-400 font-bold transition flex flex-col items-center gap-2">
                  <span className="text-2xl">✍️</span> Contrôles
                </button>
              </motion.div>
            )}
          </div>
        );
      };

      return (
        <div className="p-6 space-y-12 h-full overflow-y-auto">
          {accessibleSubjects.map((matiere) => (
            <div key={matiere} className="bg-white rounded-3xl shadow-xl p-8 border-t-8 border-blue-800">
              
              <h2 className="text-4xl font-extrabold text-blue-900 mb-8 border-b-2 border-gray-100 pb-4 text-center uppercase tracking-wide">
                {matiere}
              </h2>
                  
              <div className="flex justify-between items-center mb-10 w-full">
                <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition transform flex items-center gap-3">
                  <span className="text-2xl">▶️</span>
                  <span className="text-lg">Vidéos enregistrées</span>
                </button>
                
                <button className="px-8 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg hover:bg-red-700 hover:-translate-y-1 transition transform flex items-center gap-3">
                  <span className="text-2xl animate-pulse">🔴</span>
                  <span className="text-lg">LIVE</span>
                </button>
              </div>

              {matiere === "Physique-Chimie" ? (
                <>
                  <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">
                    📚 Programme de l'année
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div className="bg-gray-50 rounded-2xl shadow-inner p-6 border border-gray-200">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🧪</span> Chimie
                      </h3>
                      <div className="flex flex-col">
                        {chaptersBySubject["Chimie"]?.map((chapter) => renderChapterAccordion(chapter, "Chimie", matiere))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl shadow-inner p-6 border border-gray-200">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>⚡</span> Physique
                      </h3>
                      <div className="flex flex-col">
                        {chaptersBySubject["Physique"]?.map((chapter) => renderChapterAccordion(chapter, "Physique", matiere))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-2xl shadow-inner p-6 mb-10 border border-gray-200 w-full max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 justify-center">
                    <span>📚</span> Programme de l'année
                  </h3>
                  <div className="flex flex-col">
                    {chaptersBySubject[matiere]?.map((chapter) => renderChapterAccordion(chapter, matiere, matiere))}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center mt-10 border-t-2 border-gray-100 pt-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Entraînement & Évaluation</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-4xl">
                  <button onClick={() => setSection("blancs")} className="flex-1 px-8 py-4 bg-gray-800 text-white font-bold rounded-2xl shadow-lg hover:bg-gray-900 transition hover:-translate-y-1 flex items-center justify-center gap-3">
                    <span className="text-2xl">📚</span>
                    <span className="text-lg">Contrôles & Examens blancs</span>
                  </button>

                  <button 
                    onClick={() => {
                      const matiereUrl = matiere === "Mathématique" ? "Mathématique" : matiere;
                      navigate(`/student/bac-simulator?matiere=${matiereUrl}`);
                    }} 
                    className="flex-1 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    <span className="text-2xl">🎓</span>
                    <span className="text-lg text-center">Examens nationaux (Bac Simulator)</span>
                  </button>
                </div>
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
                    resetQcm();
                    setSection("qcm");
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
        <div className="p-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-green-700 border-b-2 border-green-200 pb-4">
            🎓 Examens nationaux
          </h2>
          
          {exams.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-500 text-lg bg-gray-50 p-8 rounded-xl border border-gray-200 inline-block shadow-sm">
                Aucun examen national n'est disponible pour le moment.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-6 justify-center items-start min-h-full"
            >
              {exams.map((exam) => (
                <motion.div
                  key={exam._id}
                  whileHover={{ scale: 1.05 }}
                  className="relative cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-white to-gray-100 hover:from-green-50 hover:to-white transition-all border-l-4 border-green-500 w-64 h-48 flex flex-col items-center justify-center p-4 text-center"
                  onClick={() => {
                    const examTitle = exam.title || exam._id;
                    let selectedSubject = "SP";
                    let selectedYear = "2026";
                    let selectedSession = "normale";
                    
                    const match = examTitle.match(/BAC-([A-Z]+)-(\d{4})/i);
                    if (match) {
                      selectedSubject = match[1].toUpperCase();
                      selectedYear = match[2];
                    }
                    
                    if (examTitle.toLowerCase().includes("rattrapage")) {
                      selectedSession = "rattrapage";
                    } else if (examTitle.toLowerCase().includes("normale")) {
                      selectedSession = "normale";
                    }

                    navigate(`/bac-simulator/${selectedSubject}/${selectedYear}/${selectedSession}`);
                  }}
                >
                  <span className="text-5xl mb-4">🎓</span>
                  <div className="font-bold text-green-800 text-lg">
                    {exam.title || exam._id}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                    Simulateur de note
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
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
                    <div className="font-medium mb-2 flex flex-col items-start text-lg leading-relaxed">
                      <div className="flex items-start w-full">
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[12px] mr-2 mt-0.5 shrink-0 font-bold">
                          Q{index + 1}
                        </span>
                        <div className="flex-1 text-lg font-medium text-gray-900">
                          <MixedContentRenderer text={subQ.questionText || subQ.question || subQ.texte || ""} />
                        </div>
                      </div>

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
                      {subQ.options?.map((opt: string, i: number) => {
                        const isSelected = exerciseAnswers[subQ._id] === opt;
                        const isCorrect = opt === subQ.correctAnswer;
                        
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

    if (selectedChapter && (selectedAction === "Résumé" || selectedAction === "Fiches ou résumés")) {
      return (
        <div className="p-6 relative max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-900 mb-4">
              🧠 Flashcards de Révision
            </h2>
            <p className="text-gray-600 text-lg">
              Chapitre : <span className="font-bold text-indigo-600">{selectedChapter}</span>
            </p>
          </div>
          
          {(!resumes || resumes.length === 0) ? (
             <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-400 text-center max-w-lg mx-auto">
               <span className="text-5xl block mb-4">📭</span>
               <p className="text-gray-600 text-lg font-medium">
                 Aucune fiche n'a encore été générée pour ce chapitre.
               </p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {resumes.map((resume, index) => {
                if (resume.pdfUrl) {
                  return (
                    <button
                      key={resume._id || index}
                      onClick={() => setSelectedResume(resume)}
                      className="h-80 w-full bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-white hover:scale-105 transition-transform"
                    >
                      <span className="text-5xl mb-4 block">📄</span>
                      <h3 className="text-2xl font-bold">Ouvrir le PDF</h3>
                      <p className="mt-2 text-red-100">{resume.title || "Fiche de cours"}</p>
                    </button>
                  );
                }

                const cardTitle = resume.texte || resume.title || `Concept ${index + 1}`;
                const cardContent = resume.explication || "Aucune explication détaillée disponible.";

                return (
                  <div key={resume._id || index} onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      if (token) {
                        await axios.post(`${API_BASE_URL}/api/student-activity`, {
                          type: "RESUME",
                          subject: selectedMatiere,
                          chapter: selectedChapter,
                          referenceId: resume._id,
                        }, { headers: { Authorization: `Bearer ${token}` } });
                      }
                    } catch (err) { console.error(err); }
                  }}>
                    <Flashcard title={cardTitle} content={cardContent} />
                  </div>
                );
              })}
            </div>
          )}

          {selectedResume && selectedResume.pdfUrl && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResume(null)}>
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                  <h2 className="text-xl font-bold text-red-900">{selectedResume.title || "Document PDF"}</h2>
                  <button onClick={() => setSelectedResume(null)} className="text-gray-500 hover:text-black font-bold text-2xl px-2">✖</button>
                </div>
                <iframe src={selectedResume.pdfUrl + "#toolbar=0"} className="w-full h-full" title="Résumé PDF" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // =========================================================================
    // 🌟 SECTION ADAPTÉE : QCM & EXERCICES COMPLEXES 🌟
    // =========================================================================
    if (selectedChapter && (selectedAction === "Exercises" || selectedAction === "Exercices" || selectedAction === "QCM")) {
      const currentEx = exercises[exerciseIndex];
      if (!exercises || exercises.length === 0) {
        return <p className="text-center mt-10 text-gray-500 font-semibold">Aucun exercice ou QCM trouvé pour ce chapitre.</p>;
      }

      const totalQuestionsCount = exercises.reduce((acc, ex) => acc + (ex.subQuestions?.length || 0), 0);

      // 1. DÉTECTION DYNAMIQUE : QCM vs EXERCICE
      const hasGlobalContext = Boolean(
        currentEx?.contextText || 
        currentEx?.enonce || 
        (currentEx?.texte && currentEx?.texte !== "🧠 Questions d'entraînement (QCM & Exercices générés par l'IA)")
      );

      const allQuestionsHaveOptions = currentEx?.subQuestions?.every(
        (q: any) => Array.isArray(q.options) && q.options.length > 0
      );

      const isExercice = hasGlobalContext || !allQuestionsHaveOptions;

      return (
        <div className="p-6 exercice-view-container max-w-5xl mx-auto">
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
          
          {/* 2. ENTÊTE DYNAMIQUE */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 tracking-wide uppercase">
              {isExercice 
                ? `EXERCICE ${exercises.length > 1 ? exerciseIndex + 1 : "1"}` 
                : "QUESTIONS À CHOIX MULTIPLES (QCM)"}
            </h2>
            <p className="font-semibold text-gray-500 text-sm mt-1">
              (Total : {totalQuestionsCount} question{totalQuestionsCount > 1 ? "s" : ""})
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-blue-600">
            
            {/* 3. ÉNONCÉ GLOBAL (Affiché uniquement pour les exercices) */}
            {isExercice && hasGlobalContext && (
              <div className="mb-6 border-b pb-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h3 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Énoncé</h3>
                <div className="text-base font-medium text-gray-800 leading-relaxed">
                  <MixedContentRenderer text={currentEx.contextText || currentEx.enonce || currentEx.texte || ""} />
                </div>
                
                {currentEx.contextImage && (
                  <img 
                    src={`/images/${currentEx.contextImage.replace(/^\/images\//, '')}`} 
                    alt="Illustration de l'énoncé" 
                    className="max-h-56 block mx-auto my-4 rounded-lg shadow-sm border border-gray-200" 
                  />
                )}
              </div>
            )}
            
            {/* 4. LISTE DES QUESTIONS DYNAMIQUES */}
            <div className="space-y-6">
              {currentEx.subQuestions?.map((subQ: any, index: number) => {
                const hasOptions = Array.isArray(subQ.options) && subQ.options.length > 0;

                return (
                  <div key={subQ._id || index} className="pl-4 border-l-4 border-blue-500 py-2 bg-blue-50/20 rounded-r-xl">
                    
                    <div className="font-medium mb-3 flex flex-col items-start text-lg leading-relaxed">
                      <div className="flex items-start w-full gap-2">
                        <span className="bg-blue-800 text-white px-2.5 py-0.5 rounded-md text-sm font-bold shrink-0 mt-0.5">
                          {isExercice ? `${index + 1})` : `Question ${index + 1}`}
                        </span>
                        <div className="flex-1 text-lg font-medium text-gray-900">
                          <MixedContentRenderer text={subQ.questionText || subQ.question || subQ.texte || ""} />
                        </div>
                      </div>

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
                    
                    {/* CHOIX MULTIPLES (QCM) OU ZONE DE TEXTE (EXERCICE) */}
                    {hasOptions ? (
                      <div className="ml-2 md:ml-6 grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                        {subQ.options.map((opt: string, i: number) => {
                          const isSelected = exerciseAnswers[subQ._id] === opt;
                          const isCorrect = opt === subQ.correctAnswer;
                          
                          let labelStyle = "hover:bg-blue-50 border-gray-200 bg-white";
                          if (exerciseSubmitted) {
                            if (isSelected && isCorrect) labelStyle = "bg-green-100 border-green-500 font-medium shadow-sm";
                            else if (isSelected && !isCorrect) labelStyle = "bg-red-100 border-red-500 font-medium shadow-sm";
                            else if (isCorrect) labelStyle = "bg-green-50 border-green-300 font-medium";
                            else labelStyle = "bg-gray-50 opacity-50";
                          }

                          return (
                            <label key={i} className={`flex items-start px-3.5 py-2.5 border rounded-lg cursor-pointer text-base transition-all leading-snug ${labelStyle}`}>
                              <input 
                                type="radio" 
                                name={`subQ-${subQ._id}`}
                                checked={isSelected} 
                                disabled={exerciseSubmitted} 
                                onChange={() => setExerciseAnswers((prev) => ({ ...prev, [subQ._id]: opt }))} 
                                className="mt-1 mr-3 shrink-0 accent-blue-800" 
                              />
                              <div className="flex-1 w-full">
                                <MixedContentRenderer text={opt} />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ml-2 md:ml-6 mt-2">
                        <textarea
                          disabled={exerciseSubmitted}
                          value={exerciseAnswers[subQ._id] || ""}
                          onChange={(e) => setExerciseAnswers((prev) => ({ ...prev, [subQ._id]: e.target.value }))}
                          placeholder="Espace réservé pour votre réponse..."
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 disabled:bg-gray-100 resize-y min-h-[90px]"
                        />
                      </div>
                    )}
                          
                    {/* EXPLICATION ET CORRECTION */}
                    {exerciseSubmitted && (
                      <div className="ml-2 md:ml-6 mt-3 px-4 py-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-sm">  
                        <span className="font-bold flex items-center mb-1 text-blue-900">💡 Solution & Correction :</span>
                        {subQ.correctAnswer && !hasOptions && (
                          <div className="mb-2 font-semibold text-green-700">
                            Réponse attendue : <MixedContentRenderer text={subQ.correctAnswer} />
                          </div>
                        )}
                        <div className="prose max-w-none text-gray-800">
                          <MixedContentRenderer text={subQ.explanation || subQ.explication || "Aucune explication supplémentaire fournie."} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Navigation inter-exercices */}
          <div className="flex justify-between items-center mt-6">
            <button 
              onClick={() => setExerciseIndex((i) => i - 1)} 
              disabled={exerciseIndex === 0} 
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl disabled:opacity-40 font-semibold transition"
            >
              ⬅️ Exercice Précédent
            </button>
            <button 
              onClick={() => setExerciseIndex((i) => i + 1)} 
              disabled={exerciseIndex === Math.max(0, exercises.length - 1)} 
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl disabled:opacity-40 font-semibold transition"
            >
              Exercice Suivant ➡️
            </button>
          </div>
          
          {/* BOUTON ADAPTATIF "VALIDER CE CHAPITRE" */}
          {!exerciseSubmitted && (
            <div className="mt-8 text-center">
              <button
                onClick={async () => {
                  let score = 0;
                  let totalQ = 0;

                  exercises.forEach((ex) => {
                    ex.subQuestions?.forEach((subQ: any) => {
                      totalQ++;
                      const hasOptions = Array.isArray(subQ.options) && subQ.options.length > 0;
                      
                      if (hasOptions) {
                        if (exerciseAnswers[subQ._id] === subQ.correctAnswer) {
                          score++;
                        }
                      } else {
                        if (exerciseAnswers[subQ._id] && exerciseAnswers[subQ._id].trim().length > 0) {
                          score++;
                        }
                      }
                    });
                  });

                  const wrong = exercises.filter((ex) => 
                    ex.subQuestions?.some((subQ: any) => {
                      const hasOptions = Array.isArray(subQ.options) && subQ.options.length > 0;
                      if (hasOptions) {
                        return exerciseAnswers[subQ._id] !== subQ.correctAnswer;
                      }
                      return !exerciseAnswers[subQ._id] || exerciseAnswers[subQ._id].trim().length === 0;
                    })
                  );

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
                  } catch (err) { 
                    console.error("Erreur enregistrement activité exercice:", err); 
                  }

                  setExerciseSubmitted(true);
                  setWrongExercises(wrong);
                }}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-2xl shadow-lg transition transform hover:scale-102 w-full md:w-auto"
              >
                ✅ Valider ce chapitre
              </button>
            </div>
          )}

          {exerciseSubmitted && (
            <div className="mt-6 text-center font-bold text-lg text-blue-900 bg-blue-50 py-3 px-6 rounded-xl border border-blue-200 shadow-sm max-w-xl mx-auto">
              Score du chapitre : {exerciseScore} / {totalQuestionsCount} ({exerciseAttempt === 1 ? "1er essai" : `${exerciseAttempt}ème essai`})
            </div>
          )}

          {exerciseSubmitted && wrongExercises.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setExerciseAttempt((prev) => prev + 1);
                  setExercises(wrongExercises); 
                  setExerciseIndex(0); 
                  setExerciseAnswers({}); 
                  setExerciseSubmitted(false); 
                  setExerciseScore(null);
                }}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow transition"
              >
                🔁 Refaire uniquement les exercices avec erreurs
              </button>
            </div>
          )}
        </div>
      );
    }

    if (selectedChapter && selectedAction === "Controles") {
      return (
        <div className="p-6 relative text-center">
          <h2 className="text-3xl font-bold mb-8 text-purple-800">✍️ {selectedChapter} — Contrôles</h2>
          
          {controles.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-purple-500 inline-block">
              <span className="text-4xl block mb-4">🚧</span>
              <p className="text-gray-600 text-lg font-medium">
                Aucun contrôle n'est encore disponible pour ce chapitre.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 text-left">
              {controles.map((controle, index) => (
                <div key={controle._id || index} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center gap-3 mb-4 border-b pb-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                      Question {index + 1}
                    </span>
                    {controle.note && (
                      <span className="text-gray-500 text-sm font-medium">({controle.note} points)</span>
                    )}
                  </div>
                  
                  <div className="text-lg text-gray-800 font-medium">
                    <MixedContentRenderer text={controle.texte || controle.question || "Contenu indisponible."} />
                  </div>

                  {controle.options && controle.options.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                      {controle.options.map((opt: string, i: number) => (
                        <div key={i} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <MixedContentRenderer text={opt} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <StudentDashboardStats />;
  };

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
      setSelectedMatiere(null);
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
}