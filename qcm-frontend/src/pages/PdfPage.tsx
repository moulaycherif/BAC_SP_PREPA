import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";
import PdfViewer from "../components/PdfViewer";

interface Tip {
  _id: string;
  pdfUrl?: string;
}

const PdfPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`${API_BASE_URL}/api/astuces/detail/${id}`)
      .then((res) => setTip(res.data))
      .catch((err) => {
        console.error("❌ Erreur chargement PDF :", err);
      });
  }, [id]);

  if (!tip) return <p className="text-center mt-10">Chargement...</p>;
  if (!tip.pdfUrl) return <p>Aucun PDF</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PdfViewer url={tip.pdfUrl} />
    </div>
  );
};

export default PdfPage;