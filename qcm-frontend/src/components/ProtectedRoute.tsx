import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  // Récupération des tokens (basé sur la logique utilisée dans vos autres fichiers)
  const adminToken = localStorage.getItem("adminToken");
  const studentToken = localStorage.getItem("token");

  // Cas 1 : La route exige des droits d'administrateur
  if (requireAdmin) {
    if (!adminToken) {
      // Redirection vers la page de connexion si l'admin n'est pas authentifié
      return <Navigate to="/login" replace />;
    }
  } 
  // Cas 2 : La route exige simplement d'être connecté (étudiant ou admin)
  else {
    if (!studentToken && !adminToken) {
      return <Navigate to="/login" replace />;
    }
  }

  // Si les vérifications sont passées, on affiche la page demandée
  return <>{children}</>;
};

export default ProtectedRoute;