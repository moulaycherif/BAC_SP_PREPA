// src/pages/StudentQuiz.tsx
import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { motion } from "framer-motion";
import { useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";

// 🔹 Alignement de l'interface sur le modèle Mongoose réel des Exercices
interface SubQuestion {
  _id: string;
  questionText: string;
  qType: "qcm" | "vrai_faux";
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Exercise {
  _id: string;
  subject: string;
  chapter: string;
  contextText: string;
  contextImage?: string;
  subQuestions: SubQuestion[];
}

export default function StudentQuiz() {
  const { examName, subject } = useParams<{ examName?: string; subject?: string }>();
  const location = useLocation();

  // On stocke désormais un tableau d'Exercices (contenant chacun leurs sous-questions)
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Stockage des réponses de l'étudiant : { [subQuestionId]: "Option Choisie" }
  const [answers, setAnswers] = useState<{ [id: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  // =====================================================
  // 🔹 CHARGEMENT DES EXERCICES DEPUIS LE BACKEND
  // =====================================================
  useEffect(() => {
    let url = "";
    if (location.pathname.startsWith("/exam/")) {
      url = `${API_BASE_URL}/api/exercises?exam=${encodeURIComponent(examName || "")}`;
    } else if (location.pathname.startsWith("/matiere/")) {
      url = `${API_BASE_URL}/api/exercises/by-subject/${encodeURIComponent(subject || "")}`;
    } else {
      // Endpoint de repli universel
      url = `${API_BASE_URL}/api/exercises`;
    }

    axios
      .get(url)
      .then((res) => {
        setExercises(res.data);
        
        // Calcul du total des points théoriques (1 point par sous-question par défaut)
        let total = 0;
        res.data.forEach((ex: Exercise) => {
          total += ex.subQuestions?.length || 0;
        });
        setTotalPoints(total);
      })
      .catch((err) => {
        console.error("Erreur récupération des exercices :", err);
        setExercises([]);
      });
  }, [examName, subject, location.pathname]);

  // Gérer le clic de sélection d'une option
  const handleAnswerChange = (subQuestionId: string, value: string) => {
    if (submitted) return; // Bloque les interactions après soumission
    setAnswers((prev) => ({ ...prev, [subQuestionId]: value }));
  };

  // =====================================================
  // 🔹 VALIDATION GLOBALE DES RÉPONSES
  // =====================================================
  const handleFinish = () => {
    let calculatedScore = 0;
    
    exercises.forEach((ex) => {
      ex.subQuestions.forEach((q) => {
        if (answers[q._id] === q.correctAnswer) {
          calculatedScore += 1; // 1 point attribué par bonne réponse
        }
      });
    });

    setScore(calculatedScore);
    setSubmitted(true);
    
    // Défiler automatiquement vers le haut pour afficher le score
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (exercises.length === 0) {
    return <p className="text-center mt-20 text-gray-600">Aucun exercice trouvé pour cette sélection.</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto bg-gray-50/50 min-h-screen">
      {/* Titre du module */}
      <h1 className="text-3xl font-extrabold mb-8 text-center text-blue-800 tracking-tight">
        {examName
          ? `📋 Concours — ${decodeURIComponent(examName)}`
          : `📚 Entraînement Soutien — ${decodeURIComponent(subject || "")}`}
      </h1>

      {/* Rendu dynamique de la liste complète des exercices */}
      {exercises.map((exercise, exIndex) => (
        <div key={exercise._id} className="mb-12 border-b-2 border-gray-200 pb-8 last:border-none">
          
          {/* 📜 EN-TÊTE & ÉNONCÉ GLOBAL (Reste épinglé au défilement grâce à sticky) */}
          <div className="bg-white shadow-md border-l-4 border-blue-600 rounded-xl p-5 md:p-6 mb-6 sticky top-16 z-20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                Exercice {exIndex + 1}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {exercise.subject} — {exercise.chapter}
              </span>
            </div>
            
            {/* Contenu textuel de l'énoncé riche (Quill/Maths) */}
            <div 
              className="text-gray-800 font-bold text-base md:text-lg leading-relaxed max-h-56 overflow-y-auto pr-2 justify-center"
              dangerouslySetInnerHTML={{ __html: exercise.contextText }}
            />

            {/* Image d'énoncé associée */}
            {exercise.contextImage && (
              <div className="mt-4 flex justify-center">
                <img
                  src={`${API_BASE_URL}${exercise.contextImage}`}
                  className="max-w-full max-h-[260px] object-contain rounded-lg shadow-sm border"
                  alt="Illustration contexte principal"
                />
              </div>
            )}
          </div>

          {/* 🎯 BLOCS DE SOUS-QUESTIONS RATTACHÉES (Défilement vertical continu) */}
          <div className="space-y-4 pl-0 md:pl-4">
            {exercise.subQuestions?.map((subQ, qIndex) => {
              const currentAnswer = answers[subQ._id];
              
              return (
                <div key={subQ._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm transition-all">
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg mb-4 flex items-start gap-2">
                    <span className="text-blue-600 font-bold shrink-0">Q{qIndex + 1}.</span>
                    <span dangerouslySetInnerHTML={{ __html: subQ.questionText }} />
                  </h3>

                  {/* Options de réponses interactives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subQ.options.map((opt, i) => {
                      const isSelected = currentAnswer === opt;
                      const isCorrect = subQ.correctAnswer === opt;

                      // Styles conditionnels appliqués dynamiquement selon l'état (Saisie vs Correction)
                      let optionStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";
                      
                      if (isSelected) {
                        optionStyle = "border-blue-600 bg-blue-50/70 text-blue-800 font-semibold shadow-sm";
                      }

                      if (submitted) {
                        if (isCorrect) {
                          optionStyle = "border-green-500 bg-green-100 text-green-800 font-bold shadow-sm";
                        } else if (isSelected && !isCorrect) {
                          optionStyle = "border-red-500 bg-red-100 text-red-800 line-through decoration-red-400";
                        } else {
                          optionStyle = "border-gray-100 text-gray-400 opacity-60 cursor-not-allowed";
                        }
                      }

                      return (
                        <label
                          key={i}
                          className={`flex items-center p-3.5 border-2 rounded-xl transition-all duration-150 text-sm md:text-base ${
                            !submitted ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                          } ${optionStyle}`}
                        >
                          <input
                            type="radio"
                            name={subQ._id}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(subQ._id, opt)}
                            disabled={submitted}
                            className="mr-3 w-4 h-4 accent-blue-600 shrink-0"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* 💡 Explication pédagogique dévoilée après soumission */}
                  {submitted && subQ.explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-amber-50 text-amber-900 text-sm border border-amber-200 rounded-lg shadow-inner"
                    >
                      <span className="font-bold">💡 Explication de la correction :</span>{" "}
                      <span dangerouslySetInnerHTML={{ __html: subQ.explanation }} />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ))}

      {/* ===================================================== */}
      {/* 🚀 PANNEAU DE CONTRÔLE DE VALIDATION UNIQUE */}
      {/* ===================================================== */}
      <div className="mt-10 mb-6 flex flex-col items-center justify-center gap-4">
        {submitted && score !== null && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-5 bg-blue-50 border-2 border-blue-300 text-blue-900 rounded-2xl font-bold text-xl text-center shadow w-full max-w-md"
          >
            🎯 Votre Résultat Global : {score} / {totalPoints}
            <span className="block text-xs font-medium text-blue-600 mt-1">
              ({Math.round((score / totalPoints) * 100)}% de bonnes réponses)
            </span>
          </motion.div>
        )}

        {!submitted ? (
          <button
            onClick={handleFinish}
            // Active le bouton dès qu'au moins une réponse est cochée pour éviter les blocages
            disabled={Object.keys(answers).length === 0}
            className={`w-full max-w-md py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-bold rounded-2xl shadow-md hover:from-blue-700 hover:to-indigo-800 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none tracking-wide`}
          >
            🏁 Valider toutes mes réponses ({Object.keys(answers).length} / {totalPoints})
          </button>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="w-full max-w-md py-3.5 bg-gray-800 hover:bg-gray-900 transition text-white font-bold text-base rounded-2xl shadow"
          >
            🔄 Recommencer l'exercice complet
          </button>
        )}
      </div>
    </div>
  );
}