// src/pages/ContactPage.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function ContactPage() {
  // 1️⃣ On crée des "états" pour gérer l'affichage du bouton et les messages de succès
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 2️⃣ C'est la fonction qui remplace le "form.addEventListener" de Web3Forms
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Empêche la page de se recharger
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Votre clé d'accès Web3Forms

    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY;

formData.append("access_key", accessKey);
        
    try {
      
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("✅ Succès ! Votre message a bien été envoyé.");
        form.reset(); // On vide les cases du formulaire
      } else {
        setErrorMessage("❌ Erreur : " + data.message);
      }
    } catch (error) {
      setErrorMessage("❌ Un problème est survenu. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false); // On réactive le bouton
    }
  };

  return (
    <BackgroundWrapper>
      <Navbar />
      <main className="flex flex-col min-h-screen items-center pt-24 pb-12 px-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-blue-700 mb-8"
        >
          📩 Nous Contacter
        </motion.h1>

        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg">
          {/* 3️⃣ On connecte notre fonction handleSubmit ici */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
  
  {/* Messages de succès ou d'erreur */}
  {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-lg">{successMessage}</div>}
  {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{errorMessage}</div>}

  <div>
    {/* 🔴 Changé text-black-700 par text-gray-700 */}
    <label className="block text-gray-700 font-medium mb-1">Nom complet</label>
    {/* 🟢 Ajouté text-gray-900 bg-white placeholder-gray-400 */}
    <input
      type="text"
      name="name"
      required
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
      placeholder="Votre nom"
    />
  </div>

  <div>
    {/* 🔴 Changé text-black-700 par text-gray-700 */}
    <label className="block text-gray-700 font-medium mb-1">Email</label>
    {/* 🟢 Ajouté text-gray-900 bg-white placeholder-gray-400 */}
    <input
      type="email"
      name="email"
      required
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
      placeholder="votre@email.com"
    />
  </div>

  <div>
    {/* 🔴 Changé text-black-700 par text-gray-700 */}
    <label className="block text-gray-700 font-medium mb-1">Message</label>
    {/* 🟢 Ajouté text-gray-900 bg-white placeholder-gray-400 */}
    <textarea
      name="message"
      required
      rows={4}
      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400"
      placeholder="Comment pouvons-nous vous aider ?"
    ></textarea>
  </div>
  
  <button
    type="submit"
    disabled={isSubmitting}
    className={`w-full py-3 text-white font-bold rounded-lg transition ${
      isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
  </button>
</form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-3">Ou contactez-nous directement via WhatsApp :</p>
            <a
              href="https://wa.me/212650188863"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 text-white font-bold rounded-lg shadow hover:bg-green-600 transition"
            >
              💬 "https://wa.me/212650188863"
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </BackgroundWrapper>
  );
}