import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImg from "../assets/medical-team.svg"; // ajoute une image dans /src/assets

export default function HeroSection() {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-20 mt-20">
      {/* Texte */}
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-xl text-center md:text-left"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4 leading-tight">
          Bienvenue sur <span className="text-blue-500">Med-Contest</span>
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          La plateforme de QCM interactive dédiée aux étudiants en médecine.
          Entraîne-toi, progresse et prépare-toi efficacement aux concours !
        </p>

        <div className="space-x-4">
          <Link
            to="/demo"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow"
          >
            🎯 Essayer la démo
          </Link>
          <Link
            to="/login"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold"
          >
            🔐 Se connecter
          </Link>
        </div>
      </motion.div>

      {/* Image */}
      <motion.img
        src={heroImg}
        alt="Illustration médicale"
        className="w-full md:w-1/2 mt-10 md:mt-0"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </section>
  );
}
