// src/components/BackgroundWrapper.tsx
import React, { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import bgImage from "../Image2.jfif";

interface BackEtProps {
  children: ReactNode;
}

export default function BackEt({ children }: BackEtProps) {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 500], [1, 1.1]); // léger zoom au scroll

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden text-white">
      {/* 🌄 Image de fond */}
      <motion.div
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
         /* backgroundAttachment: "fixed",*/
          scale,
          filter: "brightness(0.75)",
        }}
      />
      {/* Overlay sombre */}
     {/* <div className="absolute inset-0 bg-black/40 z-0"></div>*/}

      {/* Contenu principal */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
