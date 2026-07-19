// src/api/axios.ts
import axios from "axios";
import { API_BASE_URL } from "../config";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 🔹 1. Intercepteur de Requête Adaptatif (Optionnel mais recommandé pour injecter les tokens automatiquement)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    // On injecte le token admin s'il existe, sinon le token étudiant
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔒 2. INTERCEPTEUR DE RÉPONSE (Unique, fusionné et sécurisé)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code;
      const isGuest = localStorage.getItem("isGuest") === "true";
      const url = error.config.url || "";
      
      // 🎯 Détection blindée des requêtes de connexion (insensible à la casse et au baseURL)
      const isLoginRequest = url.toLowerCase().includes("login");

      // 🛡️ CAS A : SI ON EST EN MODE INVITÉ ET QUE CE N'EST PAS UNE TENTATIVE DE CONNEXION
      if (isGuest && !isLoginRequest) {
        console.warn("⚠️ Mode Démo : Requête restreinte ou en attente, ignorée pour la visite", url);
        
        // Simulation de succès pour éviter les écrans blancs sur l'application Démo
        if (
          url.includes("student-activity") || 
          url.includes("stats") || 
          url.includes("logout")
        ) {
          return Promise.resolve({
            status: 200,
            statusText: "OK",
            data: url.includes("student-activity") ? { message: "Activité simulée Démo" } : {},
            headers: error.response.headers,
            config: error.config,
          });
        }

        return Promise.reject(error);
      }

      // 🔑 CAS B : COMPORTEMENT NORMAL (Pour les vrais Étudiants / Admins OU requêtes de Login)
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
        return new Promise(() => {}); // Bloque la propagation du crash
      }
    }

    return Promise.reject(error);
  }
);

export default api;