import React, { useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import katex from "katex";
import axios from "../api/axios";
import { API_BASE_URL } from "../config";

import "react-quill/dist/quill.snow.css";
import "katex/dist/katex.min.css";

// Injection de KaTeX dans l'objet window pour que Quill puisse interpréter les formules
(window as any).katex = katex;

interface Props {
  value: string;
  onChange: (value: string) => void;
  // Ajout d'une prop optionnelle pour pouvoir changer l'URL d'upload si besoin
  uploadUrl?: string; 
}

export default function RichMathEditor({ 
  value, 
  onChange, 
  uploadUrl = `${API_BASE_URL}/api/astuces/upload-image` // URL par défaut
}: Props) {
  const quillRef = useRef<ReactQuill | null>(null);

  // 🔹 L'utilisation de useMemo est OBLIGATOIRE ici avec ReactQuill.
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["formula"],
          ["clean"],
        ],
        handlers: {
          image: () => {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              const formData = new FormData();
              // ⚠️ Changé en "file" pour correspondre au backend
              formData.append("file", file);

              try {
                // Récupération du token d'administration (comme dans AdminExercises)
                const adminToken = localStorage.getItem("adminToken");

                const res = await axios.post(uploadUrl, formData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    // Ajout du token s'il existe
                    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
                  },
                });

                // ⚠️ On gère à la fois imageUrl (Astuces) et url (Exercices) selon ce que renvoie le backend
                const returnedUrl = res.data.imageUrl || res.data.url;
                
                // Si le backend renvoie déjà un lien complet avec "http", on ne rajoute pas API_BASE_URL
                const finalUrl = returnedUrl.startsWith("http") 
                  ? returnedUrl 
                  : `${API_BASE_URL}${returnedUrl}`;

                const quill = quillRef.current?.getEditor();
                const range = quill?.getSelection();

                quill?.insertEmbed(
                  range?.index || 0,
                  "image",
                  finalUrl
                );
              } catch (error) {
                console.error("Erreur lors de l'upload de l'image :", error);
                alert("❌ Impossible d'importer l'image. Veuillez vérifier votre connexion ou la taille du fichier.");
              }
            };
          },
        },
      },
    };
  }, [uploadUrl]); // uploadUrl en dépendance pour que le handler soit à jour

  return (
    <div className="bg-white mb-10">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder="Rédigez votre question, astuce ou explication ici..."
      />

      <style>
        {`
          .ql-toolbar {
            background: white;
            border: 1px solid #ccc;
            border-top-left-radius: 0.375rem;
            border-top-right-radius: 0.375rem;
          }

          .ql-container {
            min-height: 220px;
            background: white;
            border: 1px solid #ccc;
            border-bottom-left-radius: 0.375rem;
            border-bottom-right-radius: 0.375rem;
            cursor: text;
          }

          .ql-editor {
            min-height: 220px;
            font-size: 16px;
            color: black;
            cursor: text;
            user-select: text;
            pointer-events: auto;
          }

          .ql-editor p {
            color: black;
          }
            
          /* Ajustement optionnel pour l'affichage des formules KaTeX dans l'éditeur */
          .ql-editor .ql-formula {
            margin: 0 4px;
          }
        `}
      </style>
    </div>
  );
}