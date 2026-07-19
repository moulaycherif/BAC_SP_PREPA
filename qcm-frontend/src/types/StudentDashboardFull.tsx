import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";

interface Question {
  _id: string;
  texte: string;
  options: string[];
  reponseCorrecte: string;
  subject: string;
  note: number;
}

export default function StudentDashboardFull() {
  // 1️⃣ Ajout de "concoursBlancList" dans les états de vue
  const [view, setView] = useState<"accueil" | "concoursList" | "matiereList" | "questions" | "concoursBlancList">("accueil");
  const [exams, setExams] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // 1. Ajoutez un nouvel état en haut avec les autres
const [concoursBlancs, setConcoursBlancs] = useState<string[]>([]);

  const subjects = ["Mathématique", "Physique", "Chimie", "SVT"];

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/questions/exams`)
      .then((res) => setExams(res.data || []))
      .catch(console.error);
      // NOUVEAU : Chargement des numéros de concours blancs
  axios.get(`${API_BASE_URL}/api/questions/exams/blancs`) // La route créée à l'étape 3
    .then((res) => setConcoursBlancs(res.data || []))
    .catch(console.error);
  }, []);

  // 3. Modifiez la fonction loadQuestions pour supporter le numéro de concours blanc
const loadQuestions = (exam: string, subject?: string, isBlanc: boolean = false) => {
  const params: any = {};
  
  if (isBlanc) {
    params.numeroConcoursBlanc = exam;
    params.typeEpreuve = 'blanc';
  } else {
    params.exam = exam;
  }
  
  if (subject) params.subject = subject;

  axios.get(`${API_BASE_URL}/api/questions`, { params })
    .then((res) => {
      setQuestions(res.data || []);
      setSelectedExam(exam);
      setSelectedSubject(subject || null);
      setView("questions");
    })
    .catch(console.error);
};
  return (
    <div
      className="flex min-h-screen text-white"
      style={{
        backgroundImage: `url("/src/assets/bg_med.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* ✅ COLONNE GAUCHE FIXE */}
      <motion.div
        className="w-1/6 bg-[rgba(15,23,42,0.85)] backdrop-blur-md p-4 flex flex-col gap-8 shadow-2xl"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div>
          <h2 className="text-[#facc15] font-bold text-lg mb-3">🧠 QCE par concours</h2>
          <button
            onClick={() => setView("concoursList")}
            className="w-full py-2 bg-[#2563eb] hover:bg-[#3b82f6] rounded-lg font-semibold transition"
          >
            🎯 Concours
          </button>
        </div>

        <div>
          <h2 className="text-[#facc15] font-bold text-lg mb-3">📘 QCE par matière</h2>
          <div className="flex flex-col gap-3">
            {subjects.map((matiere) => (
              <button
                key={matiere}
                onClick={() => {
                  setSelectedSubject(matiere);
                  setView("matiereList");
                }}
                className="py-2 bg-[#2563eb] hover:bg-[#3b82f6] rounded-lg font-semibold"
              >
                {matiere}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[#facc15] font-bold text-lg mb-3">💡 Soutien</h2>
          <div className="flex flex-col gap-3">
            {subjects.map((matiere) => (
              <button
                key={matiere}
                className="py-2 bg-[#059669] hover:bg-[#10b981] rounded-lg font-semibold"
              >
                {matiere}
              </button>
            ))}
          </div>
        </div>

        {/* 2️⃣ Ajout du 4ème bloc pour les Concours Blancs */}
        <div>
          <h2 className="text-[#facc15] font-bold text-lg mb-3">📝 CONCOURS BLANCS</h2>
          <button
            onClick={() => setView("concoursBlancList")}
            className="w-full py-2 bg-[#9333ea] hover:bg-[#a855f7] rounded-lg font-semibold transition shadow-md"
          >
            📋 Concours Blancs
          </button>
        </div>
      </motion.div>

      {/* ✅ COLONNE CENTRALE */}
      <motion.div
        className="flex-1 p-8 backdrop-blur-md bg-white/10 rounded-l-2xl overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {view === "accueil" && (
          <p className="text-center text-[#f1f5f9] text-xl mt-32">
            👈 Choisis un mode à gauche pour commencer ton entraînement.
          </p>
        )}

        {view === "concoursList" && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-[#facc15]">🏆 Choisis ton concours</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {exams.map((exam) => (
                <motion.div
                  key={exam}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/10 hover:bg-white/20 transition"
                  onClick={() => loadQuestions(exam)}
                >
                  <img
                    src={`/src/assets/concours.jfif`}
                    alt={exam}
                    className="w-full h-36 object-cover"
                  />
                  <p className="text-center py-3 font-semibold">{exam}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {view === "matiereList" && selectedSubject && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-[#facc15]">
              📘 {selectedSubject} — Choisis un concours
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {exams.map((exam) => (
                <motion.div
                  key={exam}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/10 hover:bg-white/20 transition"
                  onClick={() => loadQuestions(exam, selectedSubject)}
                >
                  <img
                    src={`/src/assets/concours.jfif`}
                    alt={selectedSubject}
                    className="w-full h-36 object-cover"
                  />
                  <p className="text-center py-3 font-semibold">{exam}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 3️⃣ Ajout de la vue Centrale pour les Concours Blancs */}
        {view === "concoursBlancList" && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-[#facc15]">📝 Liste des Concours Blancs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Espace prévu pour afficher la liste des concours blancs plus tard */}
             {/* Rendu des concours blancs */}
{concoursBlancs.map((num) => (
  <motion.div
    key={num}
    whileHover={{ scale: 1.05 }}
    className="cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/10 hover:bg-white/20 transition"
    onClick={() => loadQuestions(num, undefined, true)} // true indique que c'est un concours blanc
  >
    <img
      src={`/src/assets/concours_blanc.jfif`} // Mettez une image dédiée si vous le souhaitez
      alt={`Concours Blanc ${num}`}
      className="w-full h-36 object-cover"
    />
    <p className="text-center py-3 font-semibold text-xl">Concours Blanc n°{num}</p>
  </motion.div>
))}
            </div>
          </div>
        )}

        {view === "questions" && (
          <div className="text-center mt-12 text-lg">
            📚 Page des questions — bientôt personnalisée selon le concours ou la matière.
          </div>
        )}
      </motion.div>
    </div>
  );
}