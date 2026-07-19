import React from "react";
import katex from "katex";
import parse, { DOMNode, Element } from "html-react-parser";
import "katex/dist/katex.min.css";

function safeText(text: any): string {
  return typeof text === "string" ? text : "";
}

/**
 * Nettoie le HTML et compile le LaTeX standard ($...$) ainsi que les formules Quill (.ql-formula)
 */
export function renderWithMath(html: any) {
  try {
    const safeHtml = safeText(html);

    // 1. Remplacement des délimiteurs $...$ par un span stylisé temporaire contenant la formule compilée
    // Note: On applique \displaystyle pour un rendu mathématique optimal en mode bloc
    const formatted = safeHtml.replace(/\$(.*?)\$/g, (_, expr) => {
      const rendered = katex.renderToString(`\\displaystyle ${expr}`, {
        throwOnError: false,
        displayMode: false, // évite le saut de ligne natif de KaTeX pour garder le style en ligne
      });
      return `<span class="inline-math-highlight" style="background:#fff3cd; padding:2px 6px; border-radius:6px; display:inline-block;">${rendered}</span>`;
    });

    // 2. Options du parseur HTML pour intercepter les balises spécifiques à ReactQuill (bouton fx)
    const options = {
      replace: (domNode: DOMNode) => {
        if (
          domNode instanceof Element &&
          domNode.attribs &&
          domNode.attribs.class === "ql-formula"
        ) {
          const formula = domNode.attribs["data-value"];
          if (formula) {
            const renderedHtml = katex.renderToString(`\\displaystyle ${formula}`, {
              throwOnError: false,
            });
            return <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
          }
        }
      },
    };

    return parse(formatted, options);
  } catch (err) {
    console.error("Erreur de parsing Math:", err);
    return <span>{safeText(html)}</span>;
  }
}