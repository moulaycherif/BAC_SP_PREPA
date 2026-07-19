import React, { createContext, useContext, useState, ReactNode } from "react";
import api from "../api/axios"; // 👈 Utilisez votre instance personnalisée
import { API_BASE_URL } from "../config"; // 👈 Ajoutez cette ligne

interface AuthContextType {
  token: string | null;
  isGuest: boolean;
  login: (token: string, isGuestUser?: boolean) => void;
  loginGuest: () => Promise<void>; // 🟢 Renommé pour correspondre au Backend
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  
  // 🟢 NOUVEAU : On gère l'état invité via le localStorage pour survivre aux rafraîchissements
  const [isGuest, setIsGuest] = useState<boolean>(localStorage.getItem("isGuest") === "true");

 const login = (newToken: string, isGuestUser: boolean = false) => {
    setToken(newToken);
    setIsGuest(isGuestUser);

    localStorage.setItem("token", newToken);

    if (isGuestUser) {
      localStorage.setItem("isGuest", "true");
    } else {
      localStorage.removeItem("isGuest");
    }

    // 🚨 CORRECTION : On injecte le Token dans l'instance 'api' utilisée par le SessionGuard
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  // 🟢 NOUVEAU : Appel réel au Backend pour obtenir un VRAI jeton crypté
  const loginGuest = async () => {
    try {
      // 💡 On utilise 'api' ici aussi
      const response = await api.post("/api/auth/guest");
      login(response.data.token, true);
    } catch (error: any) {
      console.error("❌ Raison exacte du refus :", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setIsGuest(false);
    
    // 🚨 Nettoyage complet
    localStorage.removeItem("token");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("adminToken");
  };

  return (
    <AuthContext.Provider value={{ token, isGuest, login, loginGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
};