// src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios"; 

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1️⃣ Vérifie si l'un des deux tokens existe
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("token") || !!localStorage.getItem("adminToken")
  );

  // 2️⃣ Écouteur automatique d'état d'authentification
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("token") || !!localStorage.getItem("adminToken"));
    };

    checkAuth();

    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth); 

    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [location.pathname]); 

  // 🔒 Logique de déconnexion unifiée
  const handleLogout = async () => {
    try {
      const isAdmin = !!localStorage.getItem("adminToken");
      const logoutUrl = isAdmin ? "/api/auth/admin/logout" : "/api/auth/logout";
      
      await api.post(logoutUrl); 
    } catch (err) {
      console.error("Erreur lors de la déconnexion backend :", err);
    } finally {
      // Nettoyage complet
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isGuest");
      setIsAuthenticated(false); 
      navigate("/");
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isAuthenticated) {
      e.preventDefault(); 
      if (confirm("Voulez-vous fermer l'application et vous déconnecter ?")) {
        handleLogout();
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-md z-50 px-8 py-4 flex justify-between items-center">
      <Link
        to="/"
        onClick={handleLogoClick}
        className="text-2xl font-bold text-blue-700 hover:text-blue-500 transition"
      >
        🩺 Med-Contest
      </Link>

      <div className="hidden md:flex gap-6 text-gray-700 font-medium">
        <Link to="/" className="hover:text-blue-500 transition">Accueil</Link>
        <Link to="/demo" className="hover:text-blue-500 transition">Démo</Link>
        <Link to="/abonnement" className="hover:text-blue-500 transition">Abonnement</Link>
        <Link to="/contact" className="hover:text-blue-500 transition">Contact</Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-full hover:bg-red-700 transition font-medium"
          >
            Déconnexion
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition font-medium"
          >
            Connexion
          </button>
        )}
      </div>
    </nav>
  );
}