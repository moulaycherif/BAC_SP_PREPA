import api from "./axios";

export interface Astuce {
  _id: string;
  subject: string;
  chapter: string;
  title: string;
  description?: string;
  cases: any[];
  pdfUrl?: string | null;
  order?: number;
}

export async function fetchAstucesByChapter(chapter: string) {
  try {
    
    const res = await api.get(
      `/api/astuces/${encodeURIComponent(chapter)}`
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ ERREUR API ASTUCES :", error.response || error);
    return [];
  }
}
