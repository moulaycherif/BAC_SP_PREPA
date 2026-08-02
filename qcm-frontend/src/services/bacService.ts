// src/services/bacService.ts
import api from "../api/axios";

export interface BacFilters {
  years: number[];
  sessions: string[];
  themes: string[];
}

export interface BacExercise {
  _id: string;
  annee: number;
  session: string;
  theme: string;
  titreExercice: string;
  enonceTexte: string;
  imageUrl?: string;
  indices: {
    niveau1_piste: string;
    niveau2_formule: string;
    niveau3_corrige: string;
  };
  checklist: {
    description: string;
    points: number;
  }[];
}

/**
 * Récupère les listes dynamiques pour les menus déroulants (Années, Sessions, Thèmes)
 */
export const fetchBacFilters = async (): Promise<BacFilters> => {
  const response = await api.get<BacFilters>("/api/bac/filters");
  return response.data;
};

/**
 * Récupère l'exercice correspondant aux critères choisis par l'étudiant
 */
export const fetchExercises = async (annee: string, session: string, theme: string): Promise<BacExercise[]> => {
  const response = await api.get<BacExercise[]>("/api/bac/exercises", {
    params: { annee, session, theme },
  });
  return response.data;
};