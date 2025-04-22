/** @jsxImportSource react */
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ProfileStatTable from "../components/stats/ProfileStatTable";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AuthContext from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

interface ThreadSummary {
  id: number;
  title: string;
  created_at: string;
  category_slug: string;
  replies: number;
  reputation: number;
}

interface PublicUserProfile {
  about?: string;
  status?: string;
  level: number;
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

const order = ["survival", "lifesteal", "skyfactions", "creative"];
const tabList = ["About", "Stats", "Wall", "Followers", "Badges", "Threads"];
const getBadgeIcon = (id: string) => `/badges/${id}.png`;

const PublicProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Stats");
  const [userThreads, setUserThreads] = useState<ThreadSummary[]>([]);
  const { user: authUser } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/public/${username}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (authUser?.uuid && user?.uuid && authUser.uuid !== user.uuid) {
      const token = authUser?.token;
      if (!token) return;

      fetch(`${API_BASE_URL}/api/users/${user.uuid}/is-following`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => setIsFollowing(data.following))
        .catch(() => { });
    }
  }, [authUser?.uuid, user?.uuid]);

  useEffect(() => {
    if (tab === "Threads") {
      fetch(`${API_BASE_URL}/api/forums/user-threads/${username}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.threads)) setUserThreads(data.threads);
          else setUserThreads([]);
        })
        .catch(() => setUserThreads([]));
    }
  }, [tab, username]);

  const toggleFollow = async () => {
    if (!user?.uuid) return;

    const token = authUser?.token;
    if (!token) return;

    const endpoint = isFollowing
      ? `${API_BASE_URL}/api/users/${user.uuid}/unfollow`
      : `${API_BASE_URL}/api/users/${user.uuid}/follow`;

    console.log("Toggling follow state...", { isFollowing, endpoint });

    try {
      const res = await fetch(endpoint, {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Request failed: " + res.status);
      setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Follow action failed.");
    }
  };

  if (loading) return <PageLayout fullWidth><p className="text-white">Loading profile...</p></PageLayout>;
  if (!user) return <PageLayout fullWidth><p className="text-red-400 text-center">User not found.</p></PageLayout>;

  return (
    <PageLayout fullWidth>
      <div className="bg-[#1e1e22] border border-gray-700 rounded-lg overflow-hidden max-w-6xl mx-auto mt-8 shadow-xl">
        {/* Cover Photo */}
        <div
          className="relative bg-cover bg-center h-48 sm:h-64"
          style={{ backgroundImage: `url("${user.coverUrl || '/default-cover.webp'}")` }}
        >
          {/* Actions */}
          <div className="absolute top-2 right-4 flex gap-2 z-10">
            <button className="px-3 py-1 text-sm bg-purple-700 text-white rounded hover:bg-purple-600">Report</button>
            <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-500">Block</button>
          </div>

          {/* Avatar */}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10 flex items-center gap-3">
            <img
              src={`https://mc-heads.net/avatar/${user.uuid}/100`}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-[#1e1e22] bg-black shadow-lg"
              alt="Avatar"
            />
            <div className="mt-16 text-sm sm:text-base text-white font-semibold">
              Level {user.level ?? 0}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="pt-6 sm:pt-10 px-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 mt-4 sm:mt-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-3xl font-bold text-yellow-400">{user.username}</h1>
              {user.status && (
                <span className="text-sm italic text-gray-300">({user.status})</span>
              )}
              {user.badge && user.badges?.length > 0 && (() => {
                const chosen = user.badges.find((b) => b.id === user.badge);
                return chosen ? (
                  <div key={chosen.id} className="relative group">
                    <img
                      src={chosen.icon_url || getBadgeIcon(chosen.id)}
                      alt={chosen.label}
                      className="w-6 h-6 rounded"
                      onError={(e) => (e.currentTarget.src = "/badges/default.png")}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-black text-white text-xs rounded px-3 py-2 shadow-xl z-50 whitespace-nowrap min-w-[180px] max-w-[240px] text-center">
                      <span className="text-yellow-300 font-semibold">{chosen.label}</span>
                      <span className="text-gray-400 text-[10px] italic">{new Date(chosen.earned_at).toLocaleDateString()}</span>
                      <span className="text-gray-300 mt-1">{chosen.description}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              {user.badges.length > 3 && (
                <span className="text-xs text-gray-400">+{user.badges.length - 3}</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Joined: {user.joined}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
              {authUser?.uuid !== user.uuid && (
                <button
                  onClick={toggleFollow}
                  className={`px-4 py-1 rounded transition font-semibold ${isFollowing
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-yellow-500 text-black hover:bg-yellow-400"
                    }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
              <button className="bg-purple-700 text-white px-4 py-1 rounded hover:bg-purple-600">Message</button>
            </div>
          </div>

          <div className="border border-gray-700 rounded-lg p-4 text-center text-white w-full sm:w-48 sm:-mt-6">
            <div className="mb-2">
              <p className="text-xl font-bold text-purple-300">{user.reputation}</p>
              <p className="text-sm text-gray-400">Reputation</p>
            </div>
            <div className="mb-2">
              <p className="text-xl font-bold text-purple-300">{user.threadCount}</p>
              <p className="text-sm text-gray-400">Threads</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-300">{user.followers}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-6 border-t border-gray-700">
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 py-3">
            {tabList.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1 text-sm rounded-full ${tab === t ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-10">
          {tab === "Stats" && user.stats.length > 0 && order
            .map((id) => user.stats.find((s) => s.name.toLowerCase() === id))
            .filter(Boolean)
            .map((server) => server && (
              <div key={server.name} className="mb-12">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">{server.name}</h3>
                <ProfileStatTable data={server.data} server={server.name.toLowerCase()} />
              </div>
            ))}

          {tab === "About" && (
            <div className="prose prose-sm max-w-none text-white bg-black/30 p-4 rounded border border-gray-700 prose-headings:text-white prose-p:text-white prose-a:text-purple-400 hover:prose-a:text-purple-300">
              {user.about ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{user.about}</ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">
                  This user hasn’t written anything about themselves yet.
                </p>
              )}
            </div>
          )}

          {tab === "Threads" && (
            <div className="space-y-6">
              {userThreads.length === 0 ? (
                <p className="text-gray-400 italic">This user hasn’t posted any threads yet.</p>
              ) : (
                userThreads.map((thread) => (
                  <a
                    key={thread.id}
                    href={`/forums/category/${thread.category_slug}/thread/${thread.id}`}
                    className="block border border-gray-700 rounded-lg p-4 bg-[#1a1a1d] hover:border-purple-600 transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xl font-bold text-yellow-400">{thread.title}</h3>
                      <span className="text-xs text-gray-400">{new Date(thread.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex justify-between">
                      <span>{thread.replies} replies</span>
                      <span>{thread.reputation} reputation</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {tab === "Wall" && <div className="text-gray-400 italic">The wall system is coming soon.</div>}
          {tab === "Followers" && <div className="text-gray-400 italic">You’ll be able to see mutuals and follower info here.</div>}
          {tab === "Badges" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {user.badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <img src={badge.icon_url || getBadgeIcon(badge.id)} alt={badge.label} className="w-12 h-12 mx-auto" />
                  <p className="text-sm text-purple-300 mt-1">{badge.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PublicProfilePage;