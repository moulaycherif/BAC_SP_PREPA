// src/pages/DemoPage.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function DemoPage() {
  // ⚡ État de chargement pour gérer le "Cold Start" de Render
  const [isLoading, setIsLoading] = useState(false);
  const { loginGuest, logout } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    // 🚨 NETTOYAGE EXTRÊME : On évite les conflits de jetons au chargement de la page
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    logout(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction déclenchée au clic sur le bouton de démo
  const handleStartDemo = async () => {
    if (isLoading) return; // 🛡️ Sécurité anti-double clic si le serveur met du temps

    try {
      setIsLoading(true); // 🚀 On passe en mode chargement immédiat !
      await loginGuest(); 
      
      // On laisse un léger sursis à l'application pour stocker le token avant de migrer
      setTimeout(() => {
        navigate("/student");
      }, 150);
    } catch (err) {
      console.error("Erreur lors de la connexion invité", err);
      // ❌ En cas d'échec (ex: timeout ou coupure), on redonne la main à l'utilisateur
      setIsLoading(false); 
      alert("Le serveur met un peu de temps à se réveiller. Veuillez réessayer dans quelques instants.");
    }
  };

  // 🛑 VARIABLE MAGIQUE : Mettre à 'true' plus tard pour réactiver la visite guidée
  const isTourEnabled = false;

  return (
    <BackgroundWrapper>
      <Navbar />
      
      <main className="flex flex-col min-h-screen items-center justify-center pt-24 pb-12 px-6 text-center bg-white">
        
        {/* Badge d'en-tête */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm inline-block"
        >
          👀 Accès Libre & Instantané
        </motion.div>

        {/* Titre principal */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-6 max-w-3xl leading-tight"
        >
          🚀 Essayez Med-Contest gratuitement
        </motion.h1>
        
        {/* Texte explicatif */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-gray-600 text-base md:text-lg max-w-2xl mb-10 leading-relaxed"
        >
          Explorez l'interface réelle utilisée par nos étudiants. En mode invité, vous pourrez parcourir librement les différentes sections (Concours, Matières, Soutien), mais l'affichage sera limité à un seul échantillon et les interactions seront restreintes.
        </motion.p>
        
        {/* Bouton d'action principal dynamique ou Message d'indisponibilité */}
        {isTourEnabled ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <button 
              onClick={handleStartDemo}
              disabled={isLoading} // 🔒 Désactive le bouton pendant le chargement
              className={`px-8 py-4 text-white text-xl font-bold rounded-2xl shadow-xl transition transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-200 flex items-center justify-center gap-3 ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed scale-100" 
                  : "bg-green-600 hover:bg-green-700 hover:scale-105 cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  {/* Petit spinner SVG de chargement */}
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Démarrage du serveur (~45s)...</span>
                </>
              ) : (
                "Lancer la visite guidée"
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="px-8 py-4 bg-gray-100 text-gray-500 border border-gray-200 text-lg font-bold rounded-2xl shadow-inner inline-flex items-center justify-center gap-3"
          >
            🚧 La visite guidée sera très bientôt disponible
          </motion.div>
        )}

        {/* Note de réassurance */}
        {isTourEnabled && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-gray-400 mt-4 italic"
          >
            Aucune inscription ni carte bancaire requise.
          </motion.p>
        )}

      </main>
      
      <Footer />
    </BackgroundWrapper>
  );
}