import { useState } from "react";
import { generateResumePDF } from "../../api/summaryApi";

export default function SummaryEditor() {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [content, setContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!subject || !chapter || !content) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

   const generatedUrl = await generateResumePDF(subject, chapter, content);

// debug : log la réponse retournée par ta fonction API
console.log("generateResumePDF returned:", generatedUrl);

// generatedUrl doit être soit une string, soit un objet selon ton implémentation.
// Si generateResumePDF renvoie l'objet axios.res.data, adapte ainsi :
const finalUrl =
  typeof generatedUrl === "string"
    ? generatedUrl
    : generatedUrl?.pdfUrl || generatedUrl?.url || null;

if (!finalUrl) {
  alert("Erreur lors de la génération du PDF : URL non reçue.");
  return;
}

setPdfUrl(finalUrl);

    alert("PDF généré avec succès !");
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">📝 Création d’un Résumé</h2>

      <div className="mb-3">
        <label className="font-semibold">Matière :</label>
        <input
          type="text"
          className="border px-2 py-1 ml-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="font-semibold">Chapter :</label>
        <input
          type="text"
          className="border px-2 py-1 ml-2"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        />
      </div>

      <textarea
        className="border w-full h-64 p-3"
        placeholder="Écris ton résumé ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>

      <button
        onClick={handleGenerate}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700"
      >
        📄 Générer PDF
      </button>

      {pdfUrl && (
        <div className="mt-4">
          <p className="font-semibold">PDF généré :</p>

          {/* Ouvrir */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mr-4"
          >
            📄 Ouvrir le PDF
          </a>

          {/* Télécharger */}
          <a
            href={pdfUrl}
            download
            className="text-green-600 underline"
          >
            📥 Télécharger
          </a>
        </div>
      )}
    </div>
  );
}
