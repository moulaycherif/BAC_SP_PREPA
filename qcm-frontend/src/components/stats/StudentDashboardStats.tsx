import { useEffect, useState } from "react";
import api from "../../api/axios";

import QcmBarChart from "./QcmBarChart";
import ActivityLineChart from "./ActivityLineChart";
import StudentResourcesChart from "../StudentResourcesChart";
import SuccessEvolutionChart from "./SuccessEvolutionChart";

interface Resource {
  _id: string;
  count: number;
}

interface RankingItem {
  _id: string;
  total: number;
}

interface Stats {
  timeline: { _id: string; count: number }[];
  qcmBySubject: { _id: string; count: number }[];
  resources: Resource[];
  ranking: RankingItem[];
  successEvolution: {
  _id: {
    subject: string;
    date: string;
  };
  avgSuccess: number;
}[];
}

export default function StudentDashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/api/stats/student");
        setStats(res.data);
      } catch (err) {
        console.error("❌ Erreur récupération statistiques :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Chargement des statistiques...
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="text-center mt-10 text-red-500">
        Impossible de charger les statistiques.
      </p>
    );
  }

  // 📊 KPIs
  const countResource = (type: string) =>
    stats.resources.find((r) => r._id === type)?.count || 0;

  return (
    <div className="space-y-8">
      {/* 🔹 TITRE */}
      <div>
        <h1 className="text-3xl font-bold text-blue-900">
          📊 Tableau de bord étudiant
        </h1>

        <p className="text-xl font-bold-italic mt-1 text-center">
          Suivi de votre progression et de votre activité.
        </p>
      </div>

      {/* 🔹 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
        <div className="bg-white rounded-xl shadow p-3 text-center">
  <h3 className="text-sm font-semibold mb-1">
    📄 Résumés
  </h3>

  <p className="text-2xl font-bold text-blue-600">
    {countResource("RESUME")}
  </p>
</div>

        <div className="bg-white rounded-xl shadow p-3 text-center">
  <h3 className="text-sm font-semibold mb-1">
    💡 Astuces
  </h3>

  <p className="text-2xl font-bold text-yellow-500">
    {countResource("ASTUCE")}
  </p>
</div>

        <div className="bg-white rounded-xl shadow p-3 text-center">
  <h3 className="text-sm font-semibold mb-1">
    🧩 QCM
  </h3>

  <p className="text-2xl font-bold text-green-600">
    {countResource("QCM")}
  </p>
</div>

        <div className="bg-white rounded-xl shadow p-3 text-center">
  <h3 className="text-sm font-semibold mb-1">
    🏋️ Exercices
  </h3>

  <p className="text-2xl font-bold text-purple-600">
    {countResource("EXERCISE")}
  </p>
</div>
      </div>

      {/* 🔹 Graphiques */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
  <QcmBarChart data={stats.qcmBySubject} />

  <ActivityLineChart data={stats.timeline} />

      {/* 🔹 Ressources */}
      <StudentResourcesChart data={stats.resources} />
</div>
{/* 🔹 Évolution des résultats */}
<SuccessEvolutionChart
  data={stats.successEvolution}
/>

      {/* 🔹 Classement */}
      <div className="bg-white rounded-2xl shadow p-3">
        <h3 className="text-xl font-bold mb-4 text-center">
          🏆 Classement étudiant
        </h3>

        {stats.ranking.length === 0 ? (
          <p className="text-center text-gray-500">
            Aucun classement disponible.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.ranking.map((student, index) => (
              <div
                key={student._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <span className="font-semibold">
                  #{index + 1}
                </span>

                <span className="text-gray-700">
                  Étudiant {student._id}
                </span>

                <span className="font-bold text-blue-700">
                  {student.total} QCM
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}