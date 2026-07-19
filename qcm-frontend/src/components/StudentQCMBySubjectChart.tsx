import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function StudentQCMBySubjectChart({ data }: any) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow h-[350px] flex items-center justify-center text-gray-400">
        Aucun QCE
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow h-[350px]">
      <h3 className="font-semibold mb-3">📊 QCE par matière</h3>

      <div className="w-full h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="_id" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
