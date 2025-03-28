import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const types = ["ban", "mute", "kick"] as const;
type PunishmentType = typeof types[number];
type Counts = { [key in `${PunishmentType}s`]: number };

interface Punishment {
  uuid: string;
  name: string;
  reason: string;
  staff: string;
  date: number;
  expires: number | null;
  active: boolean;
}

const BanListPage = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const type = params.get("type") || "ban";
  const currentPage = parseInt(params.get("page") || "1");
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [data, setData] = useState<Punishment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Counts>({
    bans: 0,
    mutes: 0,
    kicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bedrockNames, setBedrockNames] = useState<Record<string, string>>({});

  const isBedrock = (uuid: string) => uuid.startsWith("00000000");

  const getAvatarUrl = (name: string) =>
    `https://mc-heads.net/avatar/${name}`;

  const fetchBedrockName = async (uuid: string) => {
    try {
      const res = await fetch(`/api/bans/bedrock-name/${uuid}`);
      const json = await res.json();
      if (json.platform === "bedrock") {
        setBedrockNames((prev) => ({ ...prev, [uuid]: json.username }));
      }
    } catch {
      // ignore
    }
  };

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/bans/list?type=${type}&page=${currentPage}&search=${searchQuery}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setTotalPages(res.totalPages);
        setLoading(false);

        res.data.forEach((p: Punishment) => {
          if (isBedrock(p.uuid)) {
            fetchBedrockName(p.uuid);
          }
        });
      });
  };

  useEffect(() => {
    fetch("/api/bans/counts")
      .then((res) => res.json())
      .then((res) => setCounts(res));
  }, []);

  useEffect(() => {
    fetchData();
  }, [type, currentPage, searchQuery]);

  const goTo = (key: string, value: string) => {
    if (key === "search") {
      params.set("page", "1");
    }
    params.set(key, value);
    navigate(`/bans/list?${params.toString()}`);
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-6 capitalize">
          {type}s
        </h1>

        <div className="flex justify-center mb-6 gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => goTo("type", t)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                type === t
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-purple-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}s: {counts[`${t}s`]}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6 gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-600"
            placeholder="Search by username..."
          />
          <button
            onClick={() => goTo("search", searchQuery)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-4">
            {data.map((p, i) => {
              const name = isBedrock(p.uuid) ? bedrockNames[p.uuid] || p.name : p.name;
              return (
                <div
                  key={i}
                  className="bg-[#1e1e22] border border-gray-700 rounded-lg p-4 flex items-center gap-4 justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getAvatarUrl(name)}
                      onError={(e) => (e.currentTarget.src = "https://mc-heads.net/avatar/Steve")}
                      alt={name}
                      className="w-10 h-10 rounded shadow-md"
                    />
                    <div>
                      <Link
                        to={`/bans/${p.uuid}`}
                        className="text-purple-400 font-semibold hover:underline"
                      >
                        {name}
                      </Link>
                      <p className="text-gray-400 text-sm truncate max-w-xs" title={p.reason}>
                        {p.reason}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1 mt-1">
                        <p>Issued by: <span className="text-white">{p.staff}</span></p>
                        <p>Date: <span className="text-white">{new Date(p.date).toLocaleString()}</span></p>
                        {type !== "kick" && (
                          <p>
                            Expires:{" "}
                            <span className="text-white">
                              {p.expires ? new Date(p.expires).toLocaleString() : "Never"}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {type !== "kick" && (
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        p.active
                          ? "bg-green-700 text-green-200"
                          : "bg-red-700 text-red-200"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo("page", (i + 1).toString())}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-purple-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BanListPage;
