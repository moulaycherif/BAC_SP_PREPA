import api from "./axios";

export async function fetchStudentStats() {
  const res = await api.get("/api/stats/student");
  return res.data;
}
