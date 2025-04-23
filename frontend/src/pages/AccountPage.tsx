/** @jsxImportSource react */
import { useContext, useState, useEffect, FormEvent } from "react";
import PageLayout from "../components/PageLayout";
import SecuritySection from "../components/SecuritySection";
import AuthContext from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const tabs = [
  "Your Profile",
  "Alerts",
  "Following",
  "Blocked",
  "Minecraft Account",
  "Security",
  "Preferences",
];

const AccountPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("Your Profile");

  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("");
  const [chosenBadge, setChosenBadge] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [followingList, setFollowingList] = useState<{ uuid: string; username: string }[]>([]);

  useEffect(() => {
    if (coverFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(coverFile);
    } else {
      setPreviewUrl(null);
    }
  }, [coverFile]);

  useEffect(() => {
  if (user) {
    setAbout(user.about || "");
    setStatus(user.status || "");
    setChosenBadge(user.badge || "");
  }
}, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("about", about);
      formData.append("status", status);
      formData.append("chosen_badge", chosenBadge);
      if (coverFile) formData.append("cover", coverFile);

      const res = await fetch(`${API_BASE_URL}/api/users/profile-settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Unexpected server response.");
      }
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage("✅ Profile updated successfully.");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === "Following" && user?.uuid) {
      fetch(`/api/users/${user.uuid}/following`)
        .then((res) => res.json())
        .then((data) => setFollowingList(data.following || []))
        .catch(() => setFollowingList([]));
    }
  }, [activeTab, user?.uuid]);

  return (
    <PageLayout fullWidth>
      <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Account Settings</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-6 border-b border-gray-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "bg-[#2a2a2e] text-gray-300 hover:bg-purple-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-[#1f1f1f] border border-gray-700 rounded-lg p-6 min-h-[12rem]">
          {activeTab === "Your Profile" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Status Message (max 100 characters)</label>
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  maxLength={100}
                  className="w-full bg-[#2a2a2e] border border-gray-600 text-white p-2 rounded"
                  placeholder="e.g. Building a castle on Lifesteal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">About You (Markdown allowed)</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={6}
                  maxLength={1500}
                  className="w-full bg-[#2a2a2e] border border-gray-600 text-white p-2 rounded"
                  placeholder="Tell others about yourself..."
                />
                <p className="text-xs text-gray-400 mt-1">Live Preview:</p>
                <div className="prose prose-sm max-w-none bg-black/30 p-3 rounded border border-gray-700 text-white prose-headings:text-white prose-p:text-white prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-strong:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{about || "_Nothing written yet._"}</ReactMarkdown>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Choose Displayed Badge</label>
                <select
                  value={chosenBadge}
                  onChange={(e) => setChosenBadge(e.target.value)}
                  className="w-full bg-[#2a2a2e] border border-gray-600 text-white p-2 rounded"
                >
                  <option value="">None</option>
                  {user?.badges?.map((badge: any) => (
                    <option key={badge.id} value={badge.id}>{badge.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cover Photo (max 2MB JPG/PNG)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCoverFile(e.target.files[0]);
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">Recommended resolution: 1920×400px</p>
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-2 rounded-lg w-full h-48 object-cover border border-gray-700" />
                )}
              </div>

              <button
                type="submit"
                className="bg-yellow-400 text-black px-6 py-2 rounded hover:bg-yellow-300 transition"
              >
                Save Changes
              </button>

              {message && <p className={`text-sm mt-2 ${message.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{message}</p>}
            </form>
          )}

          {activeTab === "Alerts" && <p>You’ll see notifications here.</p>}
          {activeTab === "Following" && (
            <div>
              {followingList.length === 0 ? (
                <p className="text-gray-400 italic">You're not following anyone yet.</p>
              ) : (
                <ul className="space-y-2">
                  {followingList.map((followed) => (
                    <li key={followed.uuid} className="text-white text-sm flex items-center gap-2">
                      <img
                        src={`https://mc-heads.net/avatar/${followed.uuid}/32`}
                        alt=""
                        className="w-8 h-8 rounded"
                      />
                      <a
                        href={`/dashboard/${followed.username}`}
                        className="text-purple-400 hover:underline"
                      >
                        {followed.username}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {activeTab === "Blocked" && <p>Blocked users list.</p>}
          {activeTab === "Minecraft Account" && <p>Account linking details go here.</p>}
          {activeTab === "Security" && <SecuritySection />}
          {activeTab === "Preferences" && <p>UI preferences and toggles.</p>}
        </div>
      </div>
    </PageLayout>
  );
};

export default AccountPage;
