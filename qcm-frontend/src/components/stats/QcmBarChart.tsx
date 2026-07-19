import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: {
    _id: string;
    count: number;
  }[];
}

export default function QcmBarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow h-[350px] flex items-center justify-center text-gray-400">
        Aucun QCM disponible
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 h-[320px] min-w-0">
  <h3 className="font-semibold mb-2">
    📊 QCM par matière
  </h3>

  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data}>
      <XAxis dataKey="_id" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar dataKey="count" fill="#4ade80" />
    </BarChart>
  </ResponsiveContainer>
</div>
  );
}