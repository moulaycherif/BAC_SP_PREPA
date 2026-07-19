import React, { useState } from "react";
import { Question } from "../App";

interface AddQuestionFormProps {
  onAdd: (question: Question) => void;
}

const AddQuestionForm: React.FC<AddQuestionFormProps> = ({ onAdd }) => {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [message, setMessage] = useState("");

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || options.some((opt) => !opt) || !correctAnswer || !subject || !exam) {
      setMessage("⚠️ Merci de remplir tous les champs !");
      return;
    }

    const newQuestion: Question = {
      questionText,
      options,
      correctAnswer,
      subject,
      exam,
    };

    try {
      await onAdd(newQuestion);
      setMessage("✅ Question ajoutée avec succès !");
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setSubject("");
      setExam("");
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur lors de l'ajout de la question.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 shadow-lg rounded-xl mb-8">
      <h2 className="text-xl font-bold mb-4 text-center">Ajouter une nouvelle question</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <input
          type="text"
          placeholder="Texte de la question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        {options.map((opt, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Option ${index + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        ))}

        <input
          type="text"
          placeholder="Réponse correcte"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <input
          type="text"
          placeholder="Matière (ex: Géographie)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <input
          type="text"
          placeholder="Concours / Examen (ex: Bac)"
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow"
        >
          ➕ Ajouter la question
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

export default AddQuestionForm;
