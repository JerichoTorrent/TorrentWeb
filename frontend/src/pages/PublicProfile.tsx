/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import ProfileStatTable from "../components/stats/ProfileStatTable";

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

interface PublicUserProfile {
  uuid: string;
  username: string;
  joined: string;
  lastSeen: string;
  followers: number;
  threadCount: number;
  reputation: number;
  badges: Badge[];
  stats: GamemodeStats[];
}

const order = ["survival", "lifesteal", "skyfactions", "creative"];

const getBadgeIcon = (id: string) => `/icons/badges/${id}.png`;

const PublicProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/public/${username}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.blocked) {
          setBlocked(true);
        } else {
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to load public profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (loading) {
    return (
      <PageLayout fullWidth>
        <p className="text-white">Loading profile...</p>
      </PageLayout>
    );
  }

  if (blocked) {
    return (
      <PageLayout fullWidth>
        <p className="text-red-400 text-center">
          You have blocked this user.{" "}
          <button className="underline text-yellow-400">Unblock?</button>
        </p>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout fullWidth>
        <p className="text-gray-400">User not found.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto py-10 px-6 text-white">
        {/* Avatar + Basic Info */}
        <div className="flex items-center gap-6 mb-6 flex-wrap">
          <img
            src={`https://mc-heads.net/avatar/${user.uuid}/80`}
            alt="MC Head"
            className="rounded shadow-md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-yellow-400">{user.username}</h1>
              {user.badges?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.description}
                      className="flex items-center gap-1 bg-purple-700 text-white text-xs font-medium px-2 py-1 rounded"
                    >
                      <img
                        src={badge.icon_url || getBadgeIcon(badge.id)}
                        alt={badge.label}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icons/badges/default.png";
                        }}
                        className="w-4 h-4 object-contain"
                      />
                      <span className="truncate">{badge.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">Joined: {user.joined}</p>
            <p className="text-sm text-gray-500">Last seen: {user.lastSeen}</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#2a2a2e] p-4 rounded text-center">
            <div className="text-xl font-bold">{user.followers}</div>
            <div className="text-sm text-gray-400">Followers</div>
          </div>
          <div className="bg-[#2a2a2e] p-4 rounded text-center">
            <div className="text-xl font-bold">{user.threadCount}</div>
            <div className="text-sm text-gray-400">Threads</div>
          </div>
          <div className="bg-[#2a2a2e] p-4 rounded text-center">
            <div className="text-xl font-bold">{user.reputation}</div>
            <div className="text-sm text-gray-400">Reputation</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded">
            Follow
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Block
          </button>
          <button className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded">
            Report
          </button>
        </div>

        {/* Stats Section */}
        <div>
          <h3 className="text-3xl text-yellow-400 font-bold mb-10 text-center">
            Stats
          </h3>
          {user.stats.length > 0 ? (
            order
              .map((id) =>
                user.stats.find((s) => s.name.toLowerCase() === id.toLowerCase())
              )
              .filter(Boolean)
              .map((server) => {
                const { name, data } = server!;
                const displayName =
                  {
                    survival: "Survival",
                    lifesteal: "Lifesteal",
                    skyfactions: "SkyFactions",
                    creative: "Creative",
                  }[name.toLowerCase()] || name;

                return (
                  <div key={name} className="mb-12">
                    <h4 className="text-2xl text-purple-300 font-bold mb-4">{displayName}</h4>
                    <ProfileStatTable data={data} server={name.toLowerCase()} />
                  </div>
                );
              })
          ) : (
            <p className="text-sm text-gray-400">User has no data from any gamemode.</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PublicProfilePage;
