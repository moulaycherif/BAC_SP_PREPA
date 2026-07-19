import axios from "./axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function generateResumePDF(subject: string, chapter: string, content: string) {
  const res = await axios.post(`${API_BASE_URL}/api/resume/generate`, {
    subject,
    chapter,
    content,
  });

  return res.data.pdfUrl as string;
}
