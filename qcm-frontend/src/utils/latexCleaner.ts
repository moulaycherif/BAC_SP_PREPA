export function cleanLatex(input: string): string {
  if (!input) return "";

  let output = input;

  // 🔥 1. Corriger \below (Word → LaTeX)
  output = output.replace(
    /\\below\{([^}]*)\}\{([^}]*)\}/g,
    (_, a, b) => `_{${a}} ${b}`
  );

  // 🔥 2. Flèches
  output = output.replace(/\\rightarrow/g, "\\to");

  // 🔥 3. Espaces inutiles
  output = output.replace(/\\\s+/g, "\\");

  // 🔥 4. Nettoyage accolades imbriquées bizarres
  output = output.replace(/\}\s*\}/g, "}");

  // 🔥 5. Corriger les \left( mal fermés
  output = output.replace(/\\left\s*\(/g, "\\left(");
  output = output.replace(/\\right\s*\)/g, "\\right)");

  // 🔥 6. Ajouter espace avant dx
  output = output.replace(/dx/g, "\\,dx");

  // 🔥 7. Nettoyage final
  output = output.trim();

  return output;
}