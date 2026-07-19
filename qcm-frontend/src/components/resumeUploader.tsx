import { useState } from "react";
import axios from "../api/axios";

export default function ResumeUploader() {
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return alert("Sélectionner un fichier");

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("chapter", chapter);
    formData.append("file", file);

    const response = await axios.post(
      "https://med-contest-backend.onrender.com/api/resume/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    alert("Upload réussi !");
    console.log(response.data);
  };

  return (
    <div>
      <input placeholder="Matière" onChange={(e) => setSubject(e.target.value)} />
      <input placeholder="Chapter" onChange={(e) => setChapter(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <button onClick={handleUpload}>Uploader</button>
    </div>
  );
}
