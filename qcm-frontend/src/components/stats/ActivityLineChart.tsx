import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";

interface Props {
  data: {
    _id: string;
    count: number;
  }[];
}

export default function ActivityLineChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow h-[350px] flex items-center justify-center text-gray-400">
        Aucune activité disponible
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    date: dayjs(item._id).format("DD/MM"),
  }));

  return (
    <div className="bg-white rounded-xl shadow p-3 h-[320px] min-w-0">
  <h3 className="font-semibold mb-2">
    📈 Activité dans le temps
  </h3>

  <ResponsiveContainer width="100%" height={240}>
    <LineChart data={formattedData}>
      <XAxis dataKey="date" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="count"
        stroke="#60a5fa"
        strokeWidth={2}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
  );
}