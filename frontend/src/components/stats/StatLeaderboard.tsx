import React, { useEffect, useState } from "react";
import { formatDistance, formatPlaytime } from "../../utils/statFormatters"

interface LeaderboardEntry {
  [key: string]: string | number;
  username: string;
}

interface Props {
  server: string;
  defaultCategory?: string;
}

const categories = [
  "main", "skills", "balance", "team", "jobs", "xp", "shops", "fish", "plots",
];

const categoryColumns: Record<string, { label: string; key: string }[]> = {
  main: [
    { label: "Player Kills", key: "player_kills" },
    { label: "Deaths", key: "deaths" },
    { label: "Playtime", key: "ticks_played" },
    { label: "Mob Kills", key: "mob_kills" },
    { label: "Quests Completed", key: "quests_completed" },
    { label: "Dungeons Mastered", key: "dungeons_completed" },
    { label: "Blocks Mined", key: "blocks_mined" },
    { label: "Villager Trades", key: "villager_trades" },
    { label: "Distance Flown", key: "fly_cm" },
    { label: "Distance Swam", key: "swim_cm" },
    { label: "Items Crafted", key: "items_crafted" },
    { label: "Animals Bred", key: "animals_bred" },
  ],
  skills: [
    { label: "Power", key: "power_level" },
    { label: "Anti-Grav Drive", key: "acrobatics" },
    { label: "Philosopher's Stone", key: "alchemy" },
    { label: "Jekyll", key: "archery" },
    { label: "Artorian Axe Style", key: "axes" },
    { label: "Crossbows", key: "crossbows" },
    { label: "Antiquarian", key: "excavation" },
    { label: "Angling", key: "fishing" },
    { label: "Gene Splicing", key: "herbalism" },
    { label: "Planet Cracking", key: "mining" },
    { label: "Soul Mending", key: "repair" },
    { label: "Recombination", key: "salvage" },
    { label: "Prime Arts", key: "swords" },
    { label: "Beast Master", key: "taming" },
    { label: "Implant Techniques", key: "unarmed" },
    { label: "Forester", key: "woodcutting" },
    { label: "Maces", key: "maces" },
    { label: "Tridents", key: "tridents" },
  ],
  balance: [{ label: "Balance", key: "balance" }],
  team: [
    { label: "Team Name", key: "team_name" },
    { label: "Level", key: "team_level" },
    { label: "Members", key: "team_members" },
  ],
  jobs: [
    { label: "Job", key: "job_name" },
    { label: "Level", key: "level" },
    { label: "XP", key: "xp" },
  ],
  xp: [{ label: "XP Bottled", key: "total_xp_bottled" }],
  shops: [
    { label: "Shops", key: "shops_owned" },
    { label: "Profits", key: "total_profits" },
  ],
  fish: [
    { label: "Legendary Caught", key: "legendary_fish_caught" },
    { label: "Largest", key: "largest_fish" },
  ],
  plots: [
    { label: "Plots Owned", key: "plots_owned" },
    { label: "Merged", key: "plots_merged" },
  ],
};

const sortKeyByCategory: Record<string, string> = {
  main: "player_kills",
  skills: "power_level",
  balance: "balance",
  team: "team_level",
  jobs: "level",
  xp: "total_xp_bottled",
  shops: "total_profits",
  fish: "legendary_fish_caught",
  plots: "plots_owned",
};

const StatLeaderboard: React.FC<Props> = ({ server, defaultCategory = "main" }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    const res = await fetch(
      `/api/stats/${server}?category=${category}&search=${search}&page=${page}`
    );
    const json = await res.json();
    setData(json.results || []);
    setTotal(json.total || 0);
  };

  useEffect(() => {
    fetchData();
  }, [category, search, page]);

  const cols = categoryColumns[category] || [];

  return (
    <div className="bg-[#1e1e22] border border-gray-700 mt-4 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setPage(1);
            }}
            className={`px-3 py-1 rounded text-sm ${
              cat === category ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search username"
          className="ml-auto px-2 py-1 text-sm rounded bg-black border border-gray-700 text-white"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="table-auto w-full text-sm text-white">
            <thead className="bg-gray-900 text-purple-300 text-left">
              <tr>
                <th className="px-4 py-2">Player</th>
                {cols.map((col) => (
                  <th key={col.key} className="px-4 py-2 whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sort((a, b) => {
                const key = sortKeyByCategory[category];
                return (b[key] as number) - (a[key] as number);
                // Massive struggle to get Bedrock player heads. I'll address this eventually but for no default to Steve
              }).map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#18181b]" : "bg-[#131316]"}>
                  <td className="px-4 py-2 flex items-center gap-2 whitespace-nowrap">
                  <img
                    src={
                      row.username.startsWith(".")
                        ? `https://minotar.net/avatar/Steve/24`
                        : `https://minotar.net/avatar/${row.username}/24`
                    }
                    alt="Minecraft Player Avatar Icon"
                    className="rounded"
                  />
                    {row.username}
                  </td>
                  {cols.map((col) => (
                    <td key={col.key} className="px-4 py-2 whitespace-nowrap">
                    {(() => {
                      const rawValue = row[col.key];
                  
                      if (rawValue === null || rawValue === undefined) return "—";
                  
                      // Custom formatting
                      if (col.key === "fly_cm" || col.key === "swim_cm") {
                        return formatDistance(Number(rawValue));
                      }
                  
                      if (col.key === "ticks_played") {
                        return formatPlaytime(Number(rawValue));
                      }
                  
                      return Number(rawValue).toLocaleString();
                    })()}
                  </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-300 bg-gray-900">
        <span>
          Page {page} of {Math.ceil(total / 20) || 1}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-2 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-2 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatLeaderboard;
