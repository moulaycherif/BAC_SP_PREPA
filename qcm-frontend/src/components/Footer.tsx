// src/components/Footer.tsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <p>© 2025 Med-Contest. Tous droits réservés.</p>
      <a
        href="https://wa.me/212650188863"
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-400 hover:underline block mt-1"
      >
        💬 Contact WhatsApp
      </a>
    </footer>
  );
}
