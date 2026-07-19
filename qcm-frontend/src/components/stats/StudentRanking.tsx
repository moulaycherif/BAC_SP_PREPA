export default function StudentRanking({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">Classement indisponible</p>;
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-semibold mb-2">🏆 Classement</h3>

      <ol className="space-y-1">
        {data.map((s, i) => (
          <li key={s._id}>
            {i + 1}. {s._id} — <b>{s.total}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
