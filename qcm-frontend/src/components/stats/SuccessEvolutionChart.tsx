import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EvolutionItem {
  _id: {
    subject: string;
    date: string;
  };
  avgSuccess: number;
}

interface Props {
  data: EvolutionItem[];
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
];

export default function SuccessEvolutionChart({
  data,
}: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 h-[260px] flex items-center justify-center text-gray-400">
        Aucune donnée de progression
      </div>
    );
  }

  // 🔹 Transformation des données
  const groupedByDate: Record<
    string,
    Record<string, string | number>
  > = {};

  data.forEach((item) => {
    const date = item._id.date;
    const subject =
      item._id.subject || "Autre";

    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        date,
      };
    }

    groupedByDate[date][subject] = Math.round(
      item.avgSuccess
    );
  });

  const formattedData = Object.values(
    groupedByDate
  );

  // 🔹 Liste matières uniques
  const subjects = [
    ...new Set(
      data.map(
        (item) =>
          item._id.subject || "Autre"
      )
    ),
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4 h-[360px] min-w-0">
      <h3 className="font-semibold mb-3">
        📈 Évolution des réponses justes
      </h3>

      <div className="w-full h-[280px] min-w-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={formattedData}>
            <XAxis dataKey="date" />

            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) =>
                `${value}%`
              }
            />

            <Tooltip
              formatter={(value: number) =>
                `${value}%`
              }
            />

            <Legend />

            {subjects.map(
              (subject, index) => (
                <Line
                  key={subject}
                  type="monotone"
                  dataKey={subject}
                  stroke={
                    COLORS[
                      index % COLORS.length
                    ]
                  }
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}