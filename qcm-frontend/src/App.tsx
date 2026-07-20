import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 📄 Import des pages
import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import StudentPage from "./pages/StudentPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminExercises from "./pages/AdminExercises";
import AdminAstuces from "./pages/AdminAstuces";
import StudentAstuces from "./pages/StudentAstuces";
import StudentAstuceDetail from "./pages/StudentAstuceDetail";
import StudentQuiz from "./pages/StudentQuiz";
import PdfPage from "./pages/PdfPage";

// 🧩 Import des composants
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SessionGuard from "./components/SessionGuard"; // 👈 On importe proprement le gardien séparé

export default function App() {
  return (
    <Router>
      {/* 🛡️ Le gardien enveloppe notre site pour surveiller chaque changement de page */}
      <SessionGuard />
      
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Routes>
          {/* 🏠 Pages publiques */}
          <Route path="/" element={<HomePage />} />          
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🎓 Pages Étudiants */}
          <Route path="/student/*" element={<StudentPage />} />
          <Route path="/student/astuces" element={<StudentAstuces />} />
          <Route path="/student/astuce/:id" element={<StudentAstuceDetail />} />
          <Route path="/student/quiz/:tipId" element={<StudentQuiz />} />
          <Route path="/student/pdf/:id" element={<PdfPage />} />

          {/* 👑 Pages Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/exercises" element={<AdminExercises />} />
          <Route path="/admin/astuces" element={<AdminAstuces />} />

          {/* ❌ Page introuvable (404) */}
          <Route path="/*" element={<div className="p-10 text-center text-red-600 font-semibold text-xl">Page non trouvée</div>} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}