import React from "react";

interface ChemStructureProps {
  excelLine: string; // Exemple : "(C) :<smiles>CC(C)CC(=O)OC(=O)CC(C)C</smiles>"
}

// Fonction chirurgicale d'extraction du SMILES
function extractSmiles(text: string): string {
  if (!text) return "";
  const start = text.indexOf("<smiles>");
  const end = text.indexOf("</smiles>");
  if (start === -1 || end === -1) return "";
  return text.substring(start + 8, end).replace(/[\r\n\t\s]/g, "").trim();
}

// Analyse le fragment de chaîne carbonée et le traduit en nomenclature semi-développée linéaire
function parseRadicalToSemiDev(chain: string): string {
  // Supprime le carbone du carbonyle s'il est présent en fin de chaîne de l'anhydride/ester
  let cleanChain = chain;
  if (chain.endsWith("C") && !chain.includes("(C)")) {
    cleanChain = chain.substring(0, chain.length - 1);
  }
  
  const len = cleanChain.length;
  if (len === 0) return "";
  if (len === 1) return "CH₃";
  
  const atoms = [];
  for (let i = 0; i < len; i++) {
    if (i === 0 || i === len - 1) atoms.push("CH₃");
    else atoms.push("CH₂");
  }
  return atoms.join("—");
}

export default function ChemStructure({ excelLine }: ChemStructureProps) {
  const smiles = extractSmiles(excelLine);

  if (!smiles) {
    return <span className="text-xs text-gray-400">Structure non détectée</span>;
  }

  // Styles CSS pour garantir la police fixe d'un manuel d'édition scientifique
  const textClass = "font-mono text-base font-bold text-gray-800 tracking-wide select-none whitespace-nowrap";
  const branchClass = "font-mono text-sm font-bold text-purple-600 select-none leading-none";

  // =========================================================================
  // 1. DÉTECTION AUTOMATIQUE : FAMILLE DES ANHYDRIDES (Contiennent (=O)OC(=O))
  // =========================================================================
  if (smiles.includes("(=O)OC(=O)")) {
    const parts = smiles.split("(=O)OC(=O)");
    const leftPart = parts[0];
    const rightPart = parts[1];

    // --- ANALYSE DE LA CHAÎNE DU HAUT (Partie gauche du SMILES) ---
    let topChainHtml = null;
    if (leftPart.includes("(C)")) {
      // Détection automatique de la position de la ramification Méthyle
      if (leftPart.startsWith("CCC(C)")) {
        // Cas D : Ramification sur le carbone adjacent au carbonyle (C=O)
        topChainHtml = (
          <div className="flex flex-col items-center pl-20">
            <span className={branchClass}>CH₃</span>
            <span className={`${textClass} text-xs leading-3 my-0.5`}>│</span>
            <span className={textClass}>CH₃—CH₂—CH—C</span>
          </div>
        );
      } else {
        // Cas C : Ramification éloignée du groupement carbonyle
        topChainHtml = (
          <div className="flex flex-col items-center pr-20">
            <span className={branchClass}>CH₃</span>
            <span className={`${textClass} text-xs leading-3 my-0.5`}>│</span>
            <span className={textClass}>CH₃—CH—CH₂—C</span>
          </div>
        );
      }
    } else {
      // Cas A : Chaîne linéaire automatisée
      topChainHtml = <div className={textClass}>{parseRadicalToSemiDev(leftPart)}—C</div>;
    }

    // --- ANALYSE DE LA CHAÎNE DU BAS (Partie droite du SMILES) ---
    let bottomChainHtml = null;
    if (rightPart.includes("(C)")) {
      if (rightPart.startsWith("CC(C)C") || rightPart.includes("C(C)C")) {
        // Cas ramifié bas adjacent
        bottomChainHtml = (
          <div className="flex flex-col items-center pl-20 mt-2">
            <span className={textClass}>CH₃—CH₂—CH—C</span>
            <span className={`${textClass} text-xs leading-3 my-0.5`}>│</span>
            <span className={branchClass}>CH₃</span>
          </div>
        );
      } else {
        // Cas ramifié bas éloigné
        bottomChainHtml = (
          <div className="flex flex-col items-center pr-20 mt-2">
            <span className={textClass}>CH₃—CH—CH₂—C</span>
            <span className={`${textClass} text-xs leading-3 my-0.5`}>│</span>
            <span className={branchClass}>CH₃</span>
          </div>
        );
      }
    } else {
      // Cas linéaire bas automatisé
      bottomChainHtml = <div className={textClass}>{parseRadicalToSemiDev(rightPart)}—C</div>;
    }

    return (
      <div className="relative p-6 bg-white rounded-xl border border-gray-200 shadow-sm inline-flex items-center justify-center min-w-[380px] h-[190px]">
        {/* Grille de positionnement moléculaire de l'Anhydride */}
        <div className="flex flex-col justify-center items-end pr-14 gap-y-1 w-full">
          
          {/* Bloc Supérieur + Son Oxygène double liaison */}
          <div className="relative w-full flex justify-end items-end">
            {topChainHtml}
            <div className="flex flex-col items-center ml-1 select-none">
              <span className={`${textClass} text-sm mb-0.5`}>O</span>
              <span className={`${textClass} text-xs leading-3 mb-1`}>║</span>
            </div>
          </div>

          {/* Bloc Inférieur + Son Oxygène double liaison */}
          <div className="relative w-full flex justify-end items-start mt-4">
            {bottomChainHtml}
            <div className="flex flex-col items-center ml-1 select-none">
              <span className={`${textClass} text-xs leading-3 mt-1`}>║</span>
              <span className={`${textClass} text-sm mt-0.5`}>O</span>
            </div>
          </div>
        </div>

        {/* L'atome d'Oxygène faisant le pont central */}
        <div className="absolute right-12 font-mono text-xl font-bold text-red-600 select-none">O</div>

        {/* Liaisons d'angles parfaites vers le pont oxygène */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          <line x1="71%" y1="39%" x2="81%" y2="49%" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="71%" y1="61%" x2="81%" y2="51%" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 2. DÉTECTION AUTOMATIQUE : FAMILLE DES ESTERS (Contiennent (=O)O)
  // =========================================================================
  if (smiles.includes("(=O)O")) {
    const parts = smiles.split("(=O)O");
    const leftRadical = parseRadicalToSemiDev(parts[0]);
    const rightRadical = parseRadicalToSemiDev(parts[1]);

    return (
      <div className="relative p-6 bg-white rounded-xl border border-gray-200 shadow-sm inline-flex items-center justify-center min-w-[360px] h-[140px]">
        <div className="grid grid-cols-[auto_15px_auto] grid-rows-2 items-center gap-y-2">
          {/* Chaîne principale acide carbonyle */}
          <div className={`${textClass} pr-1`}>{leftRadical}—C</div>
          
          {/* Groupe carbonyle double liaison O vers le haut */}
          <div className="flex flex-col items-center select-none col-span-2 justify-self-start">
            <span className={`${textClass} text-sm`}>O</span>
            <span className={`${textClass} text-xs leading-3`}>║</span>
          </div>

          {/* Pont Oxygène simple liaison reliant la chaîne alcool à droite */}
          <div className={`${textClass} text-xl text-red-600 pl-4 col-start-2 row-start-2`}>O</div>
          <div className={`${textClass} pl-8 col-start-3 row-start-2`}>—{rightRadical}</div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DÉTECTION AUTOMATIQUE : FAMILLE DES ÉTHERS (Contiennent "O" central simple)
  // =========================================================================
  if (smiles.includes("O") && !smiles.includes("=")) {
    const parts = smiles.split("O");
    const topChain = parseRadicalToSemiDev(parts[0]);
    const bottomChain = parseRadicalToSemiDev(parts[1]);

    return (
      <div className="relative p-6 bg-white rounded-xl border border-gray-200 shadow-sm inline-flex items-center justify-center min-w-[360px] h-[160px]">
        {/* Les deux chaînes radicalaires placées de manière strictement parallèle */}
        <div className="flex flex-col gap-10 items-end pr-16 w-full">
          <span className={textClass}>{topChain}</span>
          <span className={textClass}>{bottomChain}</span>
        </div>

        {/* Oxygène central décalé vers la droite */}
        <div className="absolute right-12 font-mono text-2xl font-bold text-red-600 select-none">O</div>

        {/* Liaisons obliques convergentes conformes au modèle de l'examen */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          <line x1="72%" y1="35%" x2="81%" y2="48%" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
          <line x1="72%" y1="65%" x2="81%" y2="52%" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return <div className="text-xs text-gray-400 p-2">Formule brute ou SMILES non pris en charge</div>;
}