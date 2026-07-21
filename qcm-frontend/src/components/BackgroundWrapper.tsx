// src/components/BackgroundWrapper.tsx
import React, { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]); // léger zoom au scroll

  // 🌟 Image Premium (Abstrait Bleu Sombre) depuis Unsplash
  const bgImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  return (
    // J'ai ajouté une couleur de fond par défaut (bg-slate-950) pendant le chargement de l'image
    <div className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden text-white bg-slate-950">
      
      {/* 🌄 Image de fond avec animation */}
      <motion.div
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(${bgImageUrl})`,
          scale,
        }}
      />
      
      {/* 🌌 Overlay "Bleu Nuit Premium" 
          Ce dégradé assombrit l'image avec des teintes bleu nuit et bleu profond 
          pour garantir une lisibilité parfaite de vos textes. */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/80 via-blue-950/70 to-slate-950/90 pointer-events-none"></div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}