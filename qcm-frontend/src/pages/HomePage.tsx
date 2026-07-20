// src/pages/HomePage.tsx
import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { Link } from "react-router-dom";

import heroImage from "../Image2.jfif";
import MedecineImage from "../assets/medicine.png"; // <-- importe ton image

export default function HomePage() {
  return (
    <BackgroundWrapper>
      <Navbar />

      {/* 🏠 Section d'accueil principale */}
      <main className="flex flex-col min-h-screen items-center justify-center text-center px-6 pt-18 pb-8 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-6 drop-shadow-lg"
        >
          🎓 Bienvenue sur <span className="text-blue-500">Med-Contest</span>
        </motion.h1>

        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.3 }}
  className="text-lg md:text-xl max-w-2xl mb-10 space-y-4"
>
  {/* Paragraphe 1 */}
  <p className="text-blue-700 font-medium">
    La plateforme marocaine dédiée aux étudiants souhaitant faire une carrière en médecine 🩺 —
  </p>

  {/* Paragraphe 2 — clignotement fluide + zoom */}
  <p className="text-red-600 font-semibold animate-blink-zoom">
    Le 1er pas passe par la réussite du Concours d'accès aux Facultés de Médecine et de Pharmacie.
  </p>

  {/* Paragraphe 3 */}
  <p className="text-gray-700">
    Cette application est un moyen efficace pour vous préparer aux concours avec des QCE interactifs,
    un suivi intelligent et un espace d’astuces pour réviser plus rapidement.
  </p>
</motion.div>



        {/* 🌟 Image au milieu */}
      <motion.img
        src={MedecineImage}
        alt="Médecine"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-64 md:w-80 lg:w-96 rounded-2xl shadow-lg mb-10"
      >
</motion.img>

        <div className="flex flex-wrap gap-6 justify-center">
          <Link
            to="/contact"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition"
          >
            📩 Nous contacter
          </Link>
        </div>
      </main>

      {/* 🧠 Section de présentation rapide */}
      <section className="px-6 py-12 bg-white text-center">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">Pourquoi choisir Med-Contest ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-blue-50 rounded-2xl shadow"
          >
            <h3 className="text-xl font-semibold text-blue-600 mb-3">📚 QCE par Conours / Matière</h3>
            <p className="text-gray-600">
              Tous les concours traités globalement ou par matière.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-green-50 rounded-2xl shadow"
          >
            <h3 className="text-xl font-semibold text-green-600 mb-3">📈 Suivi intelligent</h3>
            <p className="text-gray-600">
              Suivez votre progression, vos points forts et vos lacunes.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-purple-50 rounded-2xl shadow"
          >
            <h3 className="text-xl font-semibold text-purple-600 mb-3">👨‍🏫 Espace SOUTIEN</h3>
            <p className="text-gray-600">
              Sous forme d'astuces, de complément de cours et des exercices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 💬 Section contact + WhatsApp */}
      <section className="px-4 py-8 bg-blue-700 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Besoin d’aide ?</h2>
        <div className="flex items-center justify-center gap-4 flex-wrap">
        <p className="m-0">Contactez-nous directement sur WhatsApp pour toute question ou assistance.</p>
        <a
          href="https://wa.me/212650188863" // Remplace le numéro par ton vrai numéro WhatsApp
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 rounded-lg shadow hover:bg-green-600 transition"
        >
          💬 Discuter sur WhatsApp
        </a>
          </div>
      </section>

      <Footer />
    </BackgroundWrapper>
  );
}
