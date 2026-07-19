import api from "./axios";
import { Question } from "../types";

export async function fetchQuestionsBySubject(subject: string): Promise<Question[]> {
  const res = await api.get(`/api/questions`, {
    params: { subject }
  });
  return res.data;
}
