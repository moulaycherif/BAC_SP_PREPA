import { useNavigate } from "react-router-dom";

export default function Stats() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        ⬅ Retour au Dashboard
      </button>

      <h1 className="text-2xl font-bold">📊 Page Statistiques</h1>
    </div>
  );
}
