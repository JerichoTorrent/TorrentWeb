/** @jsxImportSource react */
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <PageLayout fullWidth>
      <h1 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2 md:mt-16">
        Your Dashboard
      </h1>

      {/* Player Profile */}
      <div className="bg-[#1e1e22] border border-gray-700 rounded-xl p-6 shadow-lg max-w-3xl mx-auto space-y-6">
        {/* Top Row: Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Minecraft avatar (placeholder for now) */}
          <img
            src={`https://mineskin.eu/armor/body/${user?.username || "Steve"}/100`}
            alt="Player Avatar"
            className="w-24 h-24 rounded-lg border border-gray-600"
          />

          {/* Player Info */}
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-2xl font-semibold text-purple-300">
              {user?.username || "PlayerName"}
            </h2>
            <p className="text-sm text-gray-400">UUID: <code className="text-gray-300">{user?.uuid || "loading..."}</code></p>
            <p className="text-sm text-gray-400">Rank: <span className="text-yellow-300">Crafter</span></p>
            <p className="text-sm text-gray-400">Joined: <span className="text-gray-300">March 2024</span></p>
          </div>
        </div>

        {/* XP Bar Placeholder */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Level 24</h3>
          <div className="w-full bg-gray-700 rounded h-3">
            <div className="bg-yellow-400 h-3 rounded w-[60%]" />
          </div>
          <p className="text-xs text-gray-400 mt-1">1240 / 2000 XP</p>
        </div>

        {/* Placeholder Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-purple-300">3.2k</p>
            <p className="text-sm text-gray-400">Blocks Mined</p>
          </div>
          <div>
            <p className="text-lg font-bold text-purple-300">18h</p>
            <p className="text-sm text-gray-400">Playtime</p>
          </div>
          <div>
            <p className="text-lg font-bold text-purple-300">#7</p>
            <p className="text-sm text-gray-400">Leaderboard Rank</p>
          </div>
          <div>
            <p className="text-lg font-bold text-purple-300">5</p>
            <p className="text-sm text-gray-400">Friends</p>
          </div>
          <div>
            <p className="text-lg font-bold text-purple-300">2</p>
            <p className="text-sm text-gray-400">Factions Joined</p>
          </div>
          <div>
            <p className="text-lg font-bold text-purple-300">✓</p>
            <p className="text-sm text-gray-400">Email Verified</p>
          </div>
        </div>

        {/* Token Display */}
        <div className="pt-6 border-t border-gray-700 text-center">
          <a
            href="/appeals/my"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
          >
            View My Appeals
          </a>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
