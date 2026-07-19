import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // On augmente légèrement la limite d'alerte à 1000 Ko (1 Mo)
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // On sépare le code de nos bibliothèques (node_modules) de notre propre code
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Toutes les dépendances iront dans un fichier "vendor.js" séparé
          }
        }
      }
    }
  }
})