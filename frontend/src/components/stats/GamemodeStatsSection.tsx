import React, { useEffect, useState } from "react";
import StatLeaderboard from "./StatLeaderboard";

interface Gamemode {
  id: string;
  name: string;
  image: string;
  lore: string;
  playerCount: number;
  extraInfo?: string;
}

const getLore = (id: string) => {
  const normalized = id.toLowerCase();
  switch (normalized) {
    case "lifesteal": return "Blood fuels strength. Trust no one.";
    case "survival": return "The original world, where nature and civilization clash.";
    case "skyfactions": return "In the void above, alliances are forged and broken.";
    case "creative": return "Limitless blocks. Infinite imagination.";
    default: return "No lore available.";
  }
};
const GamemodeStatsSection: React.FC = () => {
  const [gamemodes, setGamemodes] = useState<Gamemode[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats/gamemodes")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          return;
        }
  
        const order = ["survival", "lifesteal", "skyfactions", "creative"];
  
        const enriched = data.map((gm: any) => {
          const id = gm.id.toLowerCase(); // Normalize
          return {
            ...gm,
            id,
            image: `/${id}.png`,
            lore: getLore(id),
          };
        });
  
        const sorted = order
          .map((id) => enriched.find((g) => g.id === id))
          .filter(Boolean) as Gamemode[];
  
        setGamemodes(sorted);
      })
      .catch((err) => {
        console.error("Failed to load gamemodes", err);
      });
  }, []);  

  return (
    <div className="mt-16 px-4">
      <h2 className="text-3xl font-bold text-purple-300 text-center mb-10">Gamemode Stats</h2>

      <div className="flex flex-col gap-12 items-center">
        {gamemodes.map((mode) => (
          <div key={mode.id} className="w-full max-w-5xl">
            <div
              onClick={() => setExpanded(expanded === mode.id ? null : mode.id)}
              className="cursor-pointer transition-all border border-gray-700 bg-[#1e1e22] rounded-lg overflow-hidden shadow hover:shadow-xl"
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-yellow-400 text-2xl font-bold mt-6">{mode.name}</h3>
                <img
                  src={mode.image}
                  alt={mode.name}
                  className="w-full h-64 object-cover mt-4"
                />
                <p className="text-purple-300 text-sm mt-2 mb-4">
                  Tracking {mode.playerCount.toLocaleString()} players
                </p>
              </div>
            </div>

            {expanded === mode.id && (
              <div className="mt-4 px-4">
                <div className="bg-[#141418] border-l-4 border-purple-600 px-6 py-4 mb-4 rounded text-gray-300 italic">
                  {mode.lore}
                </div>
                <StatLeaderboard server={mode.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamemodeStatsSection;
