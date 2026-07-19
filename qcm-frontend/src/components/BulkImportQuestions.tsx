import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from "../api/axios";

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  subject: string;
  exam: string;
}

const BulkImportQuestions: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [preview, setPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    return new Promise<Question[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          try {
            const parsed: Question[] = (result.data as any[]).map((row) => ({
              questionText: row.questionText || "",
              options: [row.option1 || "", row.option2 || "", row.option3 || "", row.option4 || ""],
              correctAnswer: row.correctAnswer || "",
              subject: row.subject || "",
              exam: row.exam || "",
            }));
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });
  };

  const parseXLSX = (file: File) => {
    return new Promise<Question[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(firstSheet ? workbook.Sheets[firstSheet] : {});
          const parsed: Question[] = (sheetData as any[]).map((row) => ({
            questionText: row.questionText || "",
            options: [row.option1 || "", row.option2 || "", row.option3 || "", row.option4 || ""],
            correctAnswer: row.correctAnswer || "",
            subject: row.subject || "",
            exam: row.exam || "",
          }));
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleParse = async () => {
    if (!file) return;

    try {
      let parsedQuestions: Question[] = [];
      if (file.name.endsWith(".csv")) {
        parsedQuestions = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        parsedQuestions = await parseXLSX(file);
      } else {
        alert("Format non supporté. Utilisez CSV ou XLSX.");
        return;
      }
      setQuestions(parsedQuestions);
      setPreview(true);
    } catch (err) {
      console.error("Erreur parsing :", err);
      alert("Erreur lors du parsing du fichier.");
    }
  };

  const handleUpload = async () => {
    if (questions.length === 0) return;
    try {
      await axios.post("http://localhost:5000/api/questions/bulk", questions, {
        headers: { "Content-Type": "application/json" },
      });
      alert(`✅ ${questions.length} questions importées avec succès !`);
      setQuestions([]);
      setPreview(false);
      setFile(null);
    } catch (err) {
      console.error("Erreur upload :", err);
      alert("❌ Erreur lors de l'importation des questions.");
    }
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-2">Importer des questions (CSV ou XLSX)</h2>

      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        onClick={handleParse}
        disabled={!file}
      >
        Prévisualiser
      </button>

      {preview && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Aperçu :</h3>
          <table className="table-auto border-collapse border border-gray-400 w-full text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Question</th>
                <th className="border px-2 py-1">Options</th>
                <th className="border px-2 py-1">Réponse</th>
                <th className="border px-2 py-1">Matière</th>
                <th className="border px-2 py-1">Examen</th>
              </tr>
            </thead>
            <tbody>
              {questions.slice(0, 5).map((q, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{q.questionText}</td>
                  <td className="border px-2 py-1">{q.options.join(", ")}</td>
                  <td className="border px-2 py-1">{q.correctAnswer}</td>
                  <td className="border px-2 py-1">{q.subject}</td>
                  <td className="border px-2 py-1">{q.exam}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            onClick={handleUpload}
          >
            Importer vers le serveur
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkImportQuestions;
