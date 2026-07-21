// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";
import AdminDashboard from "./AdminDashboard";
import StudentPage from "./StudentPage";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") || localStorage.getItem("adminToken"));
  const [role, setRole] = useState<"admin" | "student" | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showForceButton, setShowForceButton] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("adminToken")) {
      setRole("admin");
    } else if (localStorage.getItem("token")) {
      setRole("student");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    // 🧼 Nettoyage préventif pour éviter que l'ancienne session étudiant ne pollue l'admin
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isGuest");
    // Suppression des anciennes options au cas où
    localStorage.removeItem("studentOptions"); 
    setError("");
    setLoading(true);

    // 👻 ANTI-FANTÔME
    localStorage.removeItem("isGuest");

    if (!force) setShowForceButton(false);

    try {
      // 1️⃣ Tentative de connexion admin
      const adminRes = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email,
        password,
        force,
      });

      // 🧹 NETTOYAGE : On s'assure qu'aucun compte étudiant n'interfère
      localStorage.removeItem("token"); 
      
      localStorage.setItem("adminToken", adminRes.data.token);
      setToken(adminRes.data.token);
      setRole("admin");
      setLoading(false);

      window.dispatchEvent(new Event("authChange"));
      return;
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.error || "Un administrateur est déjà connecté.");
        setShowForceButton(true);
        setLoading(false);
        return; 
      }
      
      if (!err.response || err.response.status >= 500) {
        setError("Erreur de connexion au serveur. Réessayez plus tard.");
        setLoading(false);
        return;
      }
    }

    try {
      // 2️⃣ Tentative de connexion étudiant
      const studentRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
        force,
      });

      // 🧹 NETTOYAGE : On s'assure qu'aucun compte admin n'interfère
      localStorage.removeItem("adminToken");

      localStorage.setItem("token", studentRes.data.token);
      
      // 👇 CORRECTION : On vérifie "student" ET "user" selon la façon dont le backend répond
      const userData = studentRes.data.student || studentRes.data.user;
      const studentOptions = userData?.options || [];

      localStorage.setItem("studentOptions", JSON.stringify(studentOptions));

      setToken(studentRes.data.token);
      setRole("student");
      setLoading(false);

      window.dispatchEvent(new Event("authChange"));
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.error || "Ce compte est déjà connecté ailleurs.");
        setShowForceButton(true);
      } else {
        setError(err.response?.data?.error || "Email ou mot de passe incorrect ❌");
      }
      setLoading(false);
    }
  };

  if (token && role === "admin") return <AdminDashboard />;
  if (token && role === "student") return <StudentPage />;

  return (
    /* 🌌 L'arrière-plan global Bleu Nuit est visible grâce à "bg-transparent" */
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent px-4">
      
      {/* ⬜ Le cadre blanc de connexion */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          🔐 Connexion
        </h1>

        <form onSubmit={(e) => handleLogin(e, false)} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setShowForceButton(false);
            }}
            className="border border-gray-300 text-gray-900 bg-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-shadow"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setShowForceButton(false);
            }}
            className="border border-gray-300 text-gray-900 bg-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-shadow"
            required
          />

          {!showForceButton && (
            <button
              type="submit"
              disabled={loading}
              className={`mt-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          )}
        </form>

        {error && !showForceButton && (
          <p className="text-red-600 text-center mt-4 font-medium">{error}</p>
        )}

        {showForceButton && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-center flex flex-col gap-3 shadow-sm"
          >
            <p className="text-amber-800 text-sm font-medium">
              ⚠️ {error}
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleLogin(e, true)}
              className="bg-amber-600 text-white text-sm font-bold py-2.5 px-4 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            >
              {loading ? "Déconnexion forcée..." : "Forcer la déconnexion de l'autre appareil"}
            </button>
          </motion.div>
        )}

        <p className="text-gray-500 text-center text-xs mt-8">
          © 2026 BAC-SP-PREPA — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}