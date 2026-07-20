// On récupère l'URL (depuis Vercel ou en local)
const rawUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 🪄 LA MAGIE ICI : On supprime automatiquement le slash à la toute fin s'il existe !
export const API_BASE_URL = rawUrl.replace(/\/$/, "");