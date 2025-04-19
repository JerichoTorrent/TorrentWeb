import React, { useState } from "react";
import { formatDistance, formatPlaytime } from "../../utils/statFormatters";

interface Job {
  job_name: string;
  level: number;
  xp: number;
}
interface TeamStats {
  team_name: string;
  team_level: number;
  team_members: number;
  team_balance: number;
}
interface Props {
  data: {
    [key: string]: string | number | Job[] | Record<string, number> | TeamStats | null;
  };
  server: string;
}

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
  team: [],
  jobs: [],
  xp: [{ label: "XP Bottled", key: "total_xp_bottled" }],
  shops: [
    { label: "Shops", key: "ez_shops" },
    { label: "Profits", key: "ez_profits" },
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

const allowedCategories: Record<string, string[]> = {
  survival: ["main", "skills", "balance", "team", "jobs", "xp", "shops", "fish"],
  lifesteal: ["main", "skills", "balance", "team", "jobs", "xp", "fish"],
  skyfactions: ["main", "skills", "balance", "jobs", "xp"],
  creative: ["main", "plots"],
};

const ProfileStatTable: React.FC<Props> = ({ data, server }) => {
  const [category, setCategory] = useState("main");
  const categories = allowedCategories[server.toLowerCase()] || [];

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "—";

    if (key === "ticks_played") {
      return formatPlaytime(value);
    }

    if (key.endsWith("_cm")) {
      return formatDistance(value);
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return String(value);
  };

  const renderRows = () => {
    if (category === "jobs") {
      const jobs = data["jobs"];
      if (Array.isArray(jobs)) {
        return jobs.map((job) => (
          <tr key={job.job_name}>
            <td className="px-4 py-2 font-medium">Job</td>
            <td className="px-4 py-2">{job.job_name}</td>
            <td className="px-4 py-2">{job.level}</td>
            <td className="px-4 py-2">{job.xp.toLocaleString()} XP</td>
          </tr>
        ));
      }
      return null;
    }

    if (category === "skills") {
      const rawSkills = data["skills"];
      const power = data["mcmmo_power_level"];

      return categoryColumns.skills.map(({ key, label }) => {
        const val =
          key === "power_level"
            ? power
            : rawSkills && typeof rawSkills === "object" && !Array.isArray(rawSkills)
              ? (rawSkills as Record<string, number>)[key]
              : undefined;

        return (
          <tr key={key}>
            <td className="px-4 py-2 font-medium">{label}</td>
            <td className="px-4 py-2">
              {typeof val === "number" || typeof val === "string" ? val : "—"}
            </td>
          </tr>
        );
      });
    }

    if (category === "team") {
      const team = data["team"] as TeamStats;
      if (team && typeof team === "object") {
        return (
          <>
            <tr><td className="px-4 py-2 font-medium">Team Name</td><td className="px-4 py-2">{team.team_name}</td></tr>
            <tr><td className="px-4 py-2 font-medium">Level</td><td className="px-4 py-2">{team.team_level}</td></tr>
            <tr><td className="px-4 py-2 font-medium">Members</td><td className="px-4 py-2">{team.team_members}</td></tr>
            <tr><td className="px-4 py-2 font-medium">Balance</td><td className="px-4 py-2">${team.team_balance.toLocaleString()}</td></tr>
          </>
        );
      }
      return null;
    }

    return (categoryColumns[category] || []).map(({ key, label }) => (
      <tr key={key}>
        <td className="px-4 py-2 font-medium">{label}</td>
        <td className="px-4 py-2">{formatValue(key, data[key])}</td>
      </tr>
    ));
  };

  return (
    <div className="bg-[#1e1e22] border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 p-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded text-sm ${
              cat === category ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm text-white">
          <tbody>{renderRows()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfileStatTable;
