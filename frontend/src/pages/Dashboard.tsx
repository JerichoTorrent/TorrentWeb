/** @jsxImportSource react */
import { useContext, useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import AuthContext from "../context/AuthContext";
import ProfileStatTable from "../components/stats/ProfileStatTable";
import { getXpProgress } from "../utils/xpUtils";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const order = ["survival", "lifesteal", "skyfactions", "creative"];
const tabList = ["Stats", "Account", "Badges"];

const getBadgeIcon = (id: string) => `/icons/badges/${id}.png`;

interface Badge {
  id: string;
  label: string;
  description: string;
  icon_url?: string;
  earned_at: string;
}

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

interface GamemodeStats {
  name: string;
  data: {
    [key: string]: string | number | Job[] | Record<string, number> | TeamStats | null;
  };
}

interface PublicUserProfile {
  level: number;
  total_xp: number;
  coverUrl: string;
  uuid: string;
  username: string;
  joined: string;
  lastSeen: string;
  followers: number;
  threadCount: number;
  reputation: number;
  badges: Badge[];
  badge?: string;
  stats: GamemodeStats[];
}

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Stats");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.username) return;
    fetch(`${API_BASE_URL}/api/users/public/${user.username}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <PageLayout fullWidth>
        <p className="text-white">Loading dashboard...</p>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout fullWidth>
        <p className="text-red-400 text-center">Unable to load your dashboard.</p>
      </PageLayout>
    );
  }

  const level = user?.level ?? 0;
  const totalXp = user?.total_xp ?? 0;
  const { currentLevelXp, nextLevelXp, progressPercent } = getXpProgress(level, totalXp);

  return (
    <PageLayout fullWidth>
      <div className="bg-[#1e1e22] border border-gray-700 rounded-lg overflow-hidden max-w-6xl mx-auto mt-8 shadow-xl">
        {/* Cover Photo */}
        <div
          className="relative bg-cover bg-center h-48 sm:h-64"
          style={{ backgroundImage: `url(${profile.coverUrl && profile.coverUrl !== "null" ? profile.coverUrl : "/default-cover.webp"})` }}
        >
          <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10 flex items-center gap-3">
            <img
              src={`https://mc-heads.net/avatar/${profile.uuid}/100`}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-[#1e1e22] bg-black shadow-lg"
              alt="Avatar"
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="pt-6 sm:pt-10 px-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 mt-4 sm:mt-0 text-center sm:text-left">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <h1 className="text-3xl font-bold text-yellow-400">{profile.username}</h1>
              {profile.badge && profile.badges.length > 0 && (() => {
                const chosen = profile.badges.find((b) => b.id === profile.badge);
                return chosen ? (
                  <div key={chosen.id} className="relative group">
                    <img
                      src={chosen.icon_url || getBadgeIcon(chosen.id)}
                      alt={chosen.label}
                      className="w-6 h-6 rounded"
                      onError={(e) => (e.currentTarget.src = "/icons/badges/default.png")}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-black text-white text-xs rounded px-3 py-2 shadow-xl z-50 whitespace-nowrap min-w-[180px] max-w-[240px] text-center">
                      <span className="text-yellow-300 font-semibold">{chosen.label}</span>
                      <span className="text-gray-400 text-[10px] italic">{new Date(chosen.earned_at).toLocaleDateString()}</span>
                      <span className="text-gray-300 mt-1">{chosen.description}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              {profile.badges.length > 3 && (
                <span className="text-xs text-gray-400">+{profile.badges.length - 3}</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Joined: {profile.joined}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => navigate("/dashboard/account")}
                className="px-3 py-1 text-sm font-medium bg-gray-800 text-yellow-400 rounded hover:bg-gray-700 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate(`/dashboard/${user?.username}`)}
                className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition"
              >
                View My Public Profile
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 mt-1 sm:mt-0 leading-tight">
            <div className="text-center">
              <p className="text-xl font-bold text-purple-300">{profile.reputation}</p>
              <p className="text-sm text-gray-400">Reputation</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-300">{profile.threadCount}</p>
              <p className="text-sm text-gray-400">Threads</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-300">{profile.followers}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="px-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Level {level}</h3>
          <div className="w-full bg-gray-700 rounded h-4 overflow-hidden shadow-inner">
            <div
              className="bg-yellow-400 h-full transition-all duration-700 ease-in-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {totalXp - currentLevelXp} / {nextLevelXp - currentLevelXp} XP
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-6 border-t border-gray-700">
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 py-3">
            {tabList.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1 text-sm rounded-full ${
                  tab === t ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-10">
          {tab === "Stats" &&
            profile.stats.length > 0 &&
            order
              .map((id) => profile.stats.find((s) => s.name.toLowerCase() === id))
              .filter(Boolean)
              .map((server) => (
                <div key={server!.name} className="mb-12">
                  <h3 className="text-2xl font-bold text-purple-300 mb-4">{server!.name}</h3>
                  <ProfileStatTable data={server!.data} server={server!.name.toLowerCase()} />
                </div>
              ))}

          {tab === "Account" && (
            <div className="grid sm:grid-cols-2 gap-4 text-center">
              <a
                href="/dashboard/account"
                className="bg-yellow-400 text-black px-4 py-3 rounded hover:bg-purple-600 hover:text-white transition"
              >
                Your Account
              </a>
              <a
                href="/appeals"
                className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-500 transition"
              >
                View My Appeals
              </a>
            </div>
          )}

          {tab === "Badges" && profile.badges.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {profile.badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <img
                    src={badge.icon_url || getBadgeIcon(badge.id)}
                    alt={badge.label}
                    className="w-12 h-12 mx-auto"
                  />
                  <p className="text-sm text-purple-300 mt-1">{badge.label}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "Badges" && profile.badges.length === 0 && (
            <div className="text-gray-400 italic">You haven’t earned any badges yet.</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;