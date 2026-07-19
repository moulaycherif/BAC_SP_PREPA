import React, { useEffect, useRef } from "react";
import SmilesDrawer from "smiles-drawer";

interface MoleculeRendererProps {
  smiles: string;
}

export default function MoleculeRenderer({ smiles }: MoleculeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && smiles) {
      // 🛠️ CONFIGURATION MINIATURE
      const options = {
        width: 150,          // Réduit de 300 à 150
        height: 150,         // Réduit de 300 à 150
        bondThickness: 1.2,  // Liaisons légèrement plus fines pour rester lisibles
        bondLength: 12,      // Raccourcit la longueur des liaisons chimiques
        theme: "light",
      };

      const smilesDrawer = new SmilesDrawer.Drawer(options);
      
      SmilesDrawer.parse(smiles, (tree) => {
        smilesDrawer.draw(tree, canvasRef.current!, "light", false);
      }, (err) => {
        console.error("❌ Erreur de parsing SMILES :", err);
      });
    }
  }, [smiles]);

  return (
    // 🎨 CONTENEUR OPTIMISÉ POUR LES OPTIONS DE QCM
    <div className="inline-block my-1 bg-white p-1 rounded-lg border border-gray-100 shadow-sm max-w-[160px] mx-auto align-middle">
      <canvas ref={canvasRef} />
    </div>
  );
}