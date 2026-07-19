import React from "react";
import { API_BASE_URL } from "../config";
import { useAuth } from "./AuthContext"; // 🟢 AJOUT : Mettez le bon chemin vers AuthContext

interface Question {
  _id: string;
  texte?: string;
  image?: string | null;
  groupId?: {
    _id: string;
    image?: string | null;
  } | null;
  options: string[];
  reponseCorrecte: string;
  subject: string;
  exam: string;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string;
  onSelect: (answer: string) => void;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelect,
}: QuestionCardProps) {
  
  const { isGuest } = useAuth(); // 🟢 AJOUT : Vérifie si c'est un invité
  const image = question.groupId?.image || question.image;

  return (
    <div className="p-4 border rounded shadow space-y-3 relative">
      
      {/* 🟢 AJOUT : Petit badge discret si on est en mode invité */}
      {isGuest && (
        <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
          Aperçu Démo
        </span>
      )}

      {/* 🖼 IMAGE */}
      {image && (
        <img
          src={`${API_BASE_URL}${image}`}
          className="max-w-lg rounded shadow"
          alt="Énoncé"
        />
      )}

      {/* 📝 TEXTE */}
      {question.texte && (
        <p className="font-semibold">{question.texte}</p>
      )}

      {/* OPTIONS */}
      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <button
            key={option}
            disabled={isGuest} // 🟢 AJOUT : Bloque le clic pour l'invité
            className={`px-3 py-2 border rounded text-left transition 
              ${isGuest ? "cursor-not-allowed opacity-70 bg-gray-50" : "hover:bg-gray-100"} 
              ${selectedAnswer === option ? "bg-blue-500 text-white" : ""}`}
            onClick={() => {
              if (!isGuest) onSelect(option); // Sécurité supplémentaire
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* 🟢 AJOUT : Message d'incitation à l'abonnement */}
      {isGuest && (
        <div className="mt-4 pt-3 border-t text-center">
          <a href="/abonnement" className="text-blue-600 text-sm font-bold hover:underline">
            🚀 Abonnez-vous pour répondre et voir la correction détaillée.
          </a>
        </div>
      )}
    </div>
  );
}