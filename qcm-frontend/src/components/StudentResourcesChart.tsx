import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface Props {
  data: {
    _id: string;
    count: number;
  }[];
}

const COLORS = [
  "#60a5fa",
  "#facc15",
  "#4ade80",
  "#c084fc",
];

export default function StudentResourcesChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-3 text-center text-gray-400">
        Aucune ressource consultée
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 h-[320px] min-w-0">
  <h3 className="text-sm font-semibold mb-2">
    📚 Ressources consultées
  </h3>

  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="_id"
        outerRadius={70}
        label
      >
        {data.map((_, index) => (
          <Cell
            key={index}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Tooltip />

      <Legend
        wrapperStyle={{
          fontSize: "11px",
        }}
      />
    </PieChart>
  </ResponsiveContainer>
</div>
  );
}