// src/api/axios.ts
import axios from "axios";
import { API_BASE_URL } from "../config";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 🔹 1. Intercepteur de Requête Adaptatif
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔒 2. INTERCEPTEUR DE RÉPONSE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code;
      const isGuest = localStorage.getItem("isGuest") === "true";
      const url = error.config.url || "";
      
      const isLoginRequest = url.toLowerCase().includes("login");

      // 🛡️ CAS A : SI ON EST EN MODE INVITÉ
      if (isGuest && !isLoginRequest) {
        console.warn("⚠️ Mode Démo : Requête restreinte ou en attente, ignorée pour la visite", url);
        
        // Simulation de succès pour éviter les écrans blancs sur l'application Démo
        if (
          url.includes("student-activity") || 
          url.includes("stats") || 
          url.includes("logout") ||
          url.includes("bac") // 🚀 NOUVEAU : Ajout pour éviter les erreurs API du Bac Simulator en mode démo
        ) {
          return Promise.resolve({
            status: 200,
            statusText: "OK",
            // Si c'est une requête de filtres du Bac, on renvoie de fausses données pour la démo
            data: url.includes("filters") 
              ? { years: [2023, 2022], sessions: ["Normale"], themes: ["Mécanique"] } 
              : { message: "Activité simulée Démo" },
            headers: error.response.headers,
            config: error.config,
          });
        }

        return Promise.reject(error);
      }

      // 🔑 CAS B : COMPORTEMENT NORMAL
      if (!isLoginRequest && (status === 403 || status === 401 || errorCode === "SESSION_KICKED")) {
        localStorage.removeItem("token");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("isGuest"); 

        if (status === 403 || errorCode === "SESSION_KICKED") {
          alert("⚠️ Déconnexion : Accès refusé ou compte actif sur un autre appareil.");
        } else {
          alert("🔑 Votre session a expiré. Veuillez vous reconnecter.");
        }

        window.location.href = "/login";
        return new Promise(() => {}); 
      }
    }

    return Promise.reject(error);
  }
);

export default api;