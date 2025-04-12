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

  const CACHE_EXPIRY_MS = 10 * 60 * 1000;

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
    const cacheKey = `punishments_${type}_${currentPage}_${searchQuery}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();

    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
        setData(parsed.data);
        setTotalPages(parsed.totalPages);
        setLoading(false);
        parsed.data.forEach((p: Punishment) => {
          if (isBedrock(p.uuid)) fetchBedrockName(p.uuid);
        });
        return;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }

    fetch(`/api/bans/list?type=${type}&page=${currentPage}&search=${searchQuery}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setTotalPages(res.totalPages);
        setLoading(false);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ timestamp: now, data: res.data, totalPages: res.totalPages })
        );
        res.data.forEach((p: Punishment) => {
          if (isBedrock(p.uuid)) fetchBedrockName(p.uuid);
        });
      });
  };

  useEffect(() => {
    const cachedCounts = localStorage.getItem("punishment_counts");
    const now = Date.now();

    if (cachedCounts) {
      const parsed = JSON.parse(cachedCounts);
      if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
        setCounts(parsed.data);
      } else {
        localStorage.removeItem("punishment_counts");
      }
    }

    fetch("/api/bans/counts")
      .then((res) => res.json())
      .then((res) => {
        setCounts(res);
        localStorage.setItem("punishment_counts", JSON.stringify({ timestamp: now, data: res }));
      });
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
                  className="bg-[#1e1e22] border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
                >
                  <div className="flex items-start gap-4">
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
                      <p className="text-gray-400 text-sm break-words max-w-full sm:max-w-xs" title={p.reason}>
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 self-start sm:self-auto">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          p.active
                            ? "bg-green-700 text-green-200"
                            : "bg-red-700 text-red-200"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                      <Link
                          to={`/bans/list/${p.uuid}`}
                          className="p-1 rounded hover:bg-purple-600 transition group"
                          title="View full punishment"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-purple-400 group-hover:text-white transition"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4m9 4h2a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
                          </svg>
                        </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center mt-8 gap-2 max-w-full overflow-hidden">
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
