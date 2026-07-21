// src/pages/HomePage.tsx
import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { Link } from "react-router-dom";

import heroImage from "../Image2.jfif";
import Soutien_BacImage from "../assets/SOUTIEN_BAC.png"; // <-- importe ton image

export default function HomePage() {
  return (
    <BackgroundWrapper>
      <Navbar />

      {/* 🏠 Section d'accueil principale */}
      {/* 🗑️ Retrait du fond blanc/bleu opaque, on laisse le body s'afficher */}
      <main className="flex flex-col min-h-screen items-center justify-center text-center px-6 pt-24 pb-12 bg-transparent">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg"
        >
          🎓 Bienvenue sur <span className="text-blue-400">Bac-SP-PREPA</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl max-w-2xl mb-10 space-y-4"
        >
          {/* Paragraphe 1 */}
          <p className="text-blue-100 font-medium leading-relaxed">
            Cette plateforme est dédiée aux élèves bacheliers (Option Sciences Physiques) souhaitant bien se préparer pour l'Examen National du Baccalauréat —
          </p>

          {/* Paragraphe 2 — clignotement fluide + zoom */}
          <p className="text-red-400 font-semibold animate-blink-zoom drop-shadow-sm">
            Ce site regroupe toutes les démarches favorables pour votre réussite.
          </p>

          {/* Paragraphe 3 */}
          <p className="text-slate-300 leading-relaxed">
            Un soutien en LIVE avec des vidéos enregistrées ainsi que des QCM interactifs,
            un suivi intelligent et un espace de méthodes rapides pour une maîtrise plus efficace.
          </p>
        </motion.div>

        {/* 🌟 Image au milieu avec un léger effet de lueur (glow) */}
        <motion.img
          src={Soutien_BacImage}
          alt="Soutien Bac"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-64 md:w-80 lg:w-96 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-white/10 mb-10"
        />

        <div className="flex flex-wrap gap-6 justify-center">
          <Link
            to="/contact"
            className="px-8 py-3 bg-blue-600/80 backdrop-blur-md border border-blue-500/50 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300"
          >
            📩 Nous contacter
          </Link>
        </div>
      </main>

      {/* 🧠 Section de présentation rapide avec effet "Verre Dépoli" (Glassmorphism) */}
      <section className="px-6 py-20 bg-transparent text-center border-t border-white/5 relative">
        <h2 className="text-3xl font-bold text-white mb-12 drop-shadow-sm">Pourquoi choisir Bac-SP-PREPA ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 bg-blue-900/20 backdrop-blur-xl border border-blue-400/20 rounded-3xl shadow-xl transition-all"
          >
            <h3 className="text-xl font-semibold text-blue-300 mb-4">📚 Des Lives réguliers</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Une stratégie de soutien ciblée pour une progression continue tout au long de l'année.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 bg-emerald-900/20 backdrop-blur-xl border border-emerald-400/20 rounded-3xl shadow-xl transition-all"
          >
            <h3 className="text-xl font-semibold text-emerald-300 mb-4">📈 Suivi intelligent</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Suivez votre progression, vos points forts et vos lacunes à travers des contrôles continus.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-8 bg-purple-900/20 backdrop-blur-xl border border-purple-400/20 rounded-3xl shadow-xl transition-all"
          >
            <h3 className="text-xl font-semibold text-purple-300 mb-4">👨‍🏫 Espace SOUTIEN</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sous forme d'astuces, de complément de cours et des exercices approfondis.
            </p>
          </motion.div>

        </div>
      </section>

      {/* 💬 Section contact + WhatsApp */}
      <section className="px-4 py-12 bg-white/5 backdrop-blur-lg border-t border-white/10 text-white text-center shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-blue-100">Besoin d’aide ?</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <p className="m-0 text-slate-300">Contactez-nous directement sur WhatsApp pour toute question ou assistance.</p>
          <a
            href="https://wa.me/212650188863"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/90 hover:bg-green-500 border border-green-400/50 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] font-semibold transition-all hover:scale-105"
          >
            💬 Discuter sur WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </BackgroundWrapper>
  );
}