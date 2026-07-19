import convert from "mathml-to-latex";

/**
 * Word (MathML) → LaTeX (KaTeX compatible)
 */
export function convertMathMLToLatex(html: string): string {
  return html.replace(
    /<math[\s\S]*?<\/math>/g,
    (mathml) => `$$ ${convert(mathml)} $$`
  );
}
