import React from "react";

export default function TestButtons() {
  return (
    <main className="p-6 text-center w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Boutons</h1>

      <div className="grid grid-cols-2 gap-4">
        <button className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
          Étudiant
        </button>
        <button className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600">
          Enseignant
        </button>
        <button className="w-full py-3 bg-purple-500 text-white rounded hover:bg-purple-600">
          Statistiques
        </button>
        <button className="w-full py-3 bg-red-500 text-white rounded hover:bg-red-600">
          Déconnexion
        </button>
      </div>
    </main>
  );
}
