import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom";

interface Punishment {
  reason: string;
  staff: string;
  date: number;
  expires: number | null;
  active: boolean;
}

interface PlayerData {
  name: string;
  uuid: string;
  history: {
    bans: Punishment[];
    mutes: Punishment[];
    kicks: Punishment[];
  };
}

const PlayerPunishments = () => {
  const { uuid } = useParams();
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bans/history/${uuid}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [uuid]);

  if (loading || !data) return <PageLayout><p className="text-center text-gray-300 mt-8">Loading...</p></PageLayout>;

  const renderList = (label: string, items: Punishment[]) => (
    <div className="mt-6">
      <h2 className="text-xl text-purple-400 font-bold mb-2">{label}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <div className="space-y-3">
          {items.map((p, i) => (
            <div key={i} className="bg-[#1e1e22] border border-gray-700 p-3 rounded">
              <p className="text-gray-300">{p.reason}</p>
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <p>Issued by: <span className="text-white">{p.staff}</span></p>
                <p>Date: <span className="text-white">{new Date(p.date).toLocaleString()}</span></p>
                {label !== "Kicks" && (
                  <p>Expires: <span className="text-white">{p.expires ? new Date(p.expires).toLocaleString() : "Never"}</span></p>
                )}
                {label !== "Kicks" && (
                  <p>Status: <span className={`font-semibold ${p.active ? "text-green-400" : "text-red-400"}`}>{p.active ? "Active" : "Inactive"}</span></p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto py-16 px-4">
        <Link to="/bans/list" className="text-sm text-gray-400 hover:text-purple-400 transition underline">
          ← Back to Bans List
        </Link>
        <h1 className="text-3xl text-yellow-400 font-bold mb-6 text-center">
          Punishments for {data.name}
        </h1>
        {renderList("Bans", data.history.bans)}
        {renderList("Mutes", data.history.mutes)}
        {renderList("Kicks", data.history.kicks)}
      </div>
    </PageLayout>
  );
};

export default PlayerPunishments;
