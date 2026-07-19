import React from "react";
import StudentDashboardStats from "../components/stats/StudentDashboardStats"; // Ajustez le chemin selon votre dossier

export default function StatsPage() {
  return (
    // max-w-7xl limite la largeur sur grand écran pour éviter l'étirement
    // pt-24 laisse de la place pour la Navbar fixe du haut
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 shadow-inner">
        <StudentDashboardStats />
      </div>
    </div>
  );
}