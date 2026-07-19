import React, { useState } from "react";

const BulkAddQuestions: React.FC = () => {
  const [bulkText, setBulkText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      // On suppose que l’utilisateur colle du JSON valide
      const questions = JSON.parse(bulkText);

      if (!Array.isArray(questions)) {
        setStatus("❌ Le format doit être un tableau JSON d’objets.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questions),
      });

      if (res.ok) {
        setStatus("✅ Questions ajoutées avec succès !");
        setBulkText("");
      } else {
        setStatus("❌ Erreur lors de l’ajout.");
      }
    } catch (err) {
      setStatus("❌ Format JSON invalide.");
    }
  };

  return (
    <form onSubmit={handleBulkSubmit} className="space-y-4">
      <textarea
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder={`Collez un tableau JSON, par ex :

[
  {
    "questionText": "Quelle est la capitale de l'Espagne ?",
    "options": ["Madrid", "Barcelone", "Valence", "Séville"],
    "correctAnswer": "Madrid",
    "subject": "Géographie",
    "exam": "Bac"
  },
  {
    "questionText": "Qui a peint La Joconde ?",
    "options": ["Picasso", "Da Vinci", "Van Gogh", "Rembrandt"],
    "correctAnswer": "Da Vinci",
    "subject": "Art",
    "exam": "Concours ENS"
  }
]`}
        rows={12}
        className="w-full border rounded p-2 font-mono text-sm"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Ajouter en masse
      </button>

      {status && <p className="mt-2">{status}</p>}
    </form>
  );
};

export default BulkAddQuestions;
