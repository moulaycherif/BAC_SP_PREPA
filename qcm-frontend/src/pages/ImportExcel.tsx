import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Upload } from "lucide-react";
import React, { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ImportExcel({ onImported }: { onImported?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setFileName(event.target.files[0].name);
    }
  };

  const handleImport = async (mode: "append" | "replace" | "replace-global") => {
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `http://localhost:5000/api/questions/import-excel?mode=${mode}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Message plus explicite selon le mode
      const modeText =
        mode === "append"
          ? "Ajout"
          : mode === "replace"
          ? "Remplacement examen"
          : "Remplacement global";

      setStatus(`✅ ${modeText} terminé ! (${res.data.inserted} questions insérées)`);

      if (onImported) onImported();
    } catch (err: any) {
      console.error("Erreur frontend axios:", err.response?.data || err.message);
      setStatus("❌ Erreur lors de l'import du fichier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        ⬅ Retour au Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">📥 Importer un fichier Excel</h1>

      <Card className="max-w-lg mx-auto shadow-md rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label htmlFor="file">Sélectionnez un fichier Excel</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            {fileName && <p className="text-sm text-gray-500 mt-2">📄 {fileName}</p>}
          </div>

          <Button
            className="w-full bg-blue-600"
            disabled={!file || loading}
            onClick={() => handleImport("append")}
          >
            {loading ? "Importation..." : "Ajouter (append)"}
          </Button>

          <Button
            className="w-full bg-red-600 mt-2"
            disabled={!file || loading}
            onClick={() => handleImport("replace")}
          >
            {loading ? "Importation..." : "Remplacer examen"}
          </Button>

          <Button
            className="w-full bg-red-800 mt-2"
            disabled={!file || loading}
            onClick={() => handleImport("replace-global")}
          >
            {loading ? "Importation..." : "Remplacer tout (global)"}
          </Button>

          {status && (
            <p
              className={`text-sm mt-2 ${
                status.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {status}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
