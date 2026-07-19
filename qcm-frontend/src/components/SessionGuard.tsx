// src/components/SessionGuard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // 👈 On utilise votre instance Axios configurée

export default function SessionGuard() {
  const navigate = useNavigate(); // 👈 C'est cet outil qui permet de rediriger vers "/"

  useEffect(() => {
    // 🛡️ On crée un intercepteur sur les réponses de l'API
    const interceptor = api.interceptors.response.use(
      (response) => response, // Si tout va bien, on laisse passer la réponse
      (error) => {
        // 🚨 Si le serveur renvoie une erreur 403 (Interdit)
        if (error.response && error.response.status === 403) {
          const data = error.response.data;

          // Si le code d'erreur est bien celui de la session écrasée
          if (data.code === "SESSION_KICKED") {
            // 1️⃣ On nettoie les jetons d'accès du navigateur
            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");

            // 2️⃣ On affiche un message clair à l'utilisateur
            alert("⚠️ Votre session a expiré ou votre compte est connecté sur un autre appareil.");

            // 3️⃣ On éjecte immédiatement l'utilisateur vers la page d'accueil ou de connexion
            navigate("/login"); 
          }
        }
        return Promise.reject(error);
      }
    );

    // Nettoyage de l'intercepteur si le composant est démonté
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  return null; // Ce composant fait sa surveillance en tâche de fond, il n'affiche rien
}