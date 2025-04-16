import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";
import AuthContext from "../context/AuthContext";

const boxes = [
  {
    title: "Bans",
    description: "View permanently or temporarily banned players on the Torrent Network.",
    image: "/ban.png",
    link: "/bans/list?type=ban",
    bg: "bg-red-600/10 border-red-600"
  },
  {
    title: "Mutes",
    description: "See players who have been muted permanently or temporarily for abuse in chat.",
    image: "/mute.png",
    link: "/bans/list?type=mute",
    bg: "bg-yellow-600/10 border-yellow-600"
  },
  {
    title: "Kicks",
    description: "Browse temporary player removals due to behavior, spam, or rule-breaking.",
    image: "/kick.png",
    link: "/bans/list?type=kick",
    bg: "bg-purple-600/10 border-purple-600"
  }
];

const appealBoxes = [
  { title: "Minecraft Ban Appeal", type: "minecraft-ban" },
  { title: "Minecraft Mute Appeal", type: "minecraft-mute" },
  { title: "Discord Appeal", type: "discord" }
];

const Spinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const BansPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState<Record<string, string>>({});

  const handleAppealClick = async (type: string, retry = false) => {
    if (!user || !user.token) {
      setStatus(prev => ({ ...prev, [type]: "⚠ You must be logged in to appeal." }));
      return;
    }

    setStatus(prev => ({ ...prev, [type]: "⏳ Checking your punishment status..." }));

    try {
      if (type === "discord") {
        const discordRes = await fetch("/api/discord/check-link", {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        const discordData = await discordRes.json();

        if (!discordData.linked) {
          setStatus(prev => ({ ...prev, [type]: "🔗 Linking your Discord account..." }));

          const popup = window.open(
            `/api/auth/discord?token=${user.token}`,
            "_blank",
            "width=500,height=600"
          );

          const handleMessage = async (event: MessageEvent) => {
            console.log("🔍 Got postMessage:", event.data);

            if (event.origin !== window.location.origin) {
              console.warn("⚠ Ignored message from unexpected origin:", event.origin);
              return;
            }

            if (event.data && event.data.type === "DISCORD_LINKED") {
              console.log("✅ Discord successfully linked!");

              try {
                const confirmRes = await fetch("/api/discord/check-link", {
                  headers: { Authorization: `Bearer ${user.token}` },
                });

                const confirmData = await confirmRes.json();
                if (confirmData.linked) {
                  handleAppealClick(type, true);
                } else {
                  setStatus(prev => ({ ...prev, [type]: "❌ Failed to link Discord." }));
                }
              } catch (err) {
                console.error("❌ Error checking Discord linking:", err);
                setStatus(prev => ({ ...prev, [type]: "❌ Failed to verify Discord link." }));
              }
            } else {
              console.warn("⚠ Unexpected message data:", event.data);
            }
          };

          window.addEventListener("message", handleMessage);

          const timer = setInterval(async () => {
            if (popup?.closed) {
              clearInterval(timer);

              const confirmRes = await fetch("/api/discord/check-link", {
                headers: { Authorization: `Bearer ${user.token}` }
              });

              const confirmData = await confirmRes.json();

              if (confirmData.linked) {
                handleAppealClick(type, true);
              } else {
                setStatus(prev => ({ ...prev, [type]: "❌ Failed to link Discord." }));
              }
            }
          }, 500);

          return;
        }
      }

      const res = await fetch(`/api/appeals/check-eligibility?type=${type}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Cache-Control": "no-cache"
        },
        cache: "no-store"
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ Server response was not JSON:", text);
        setStatus(prev => ({
          ...prev,
          [type]: "❌ Unexpected server error. Please try again later."
        }));
        return;
      }

      if (res.ok && data.eligible) {
        setStatus(prev => ({ ...prev, [type]: "✅ Redirecting..." }));
        setTimeout(() => navigate(`/appeals/${type}`), 1000);
      } else {
        const msg = data?.cooldown
          ? `⚠ You can only appeal once every 30 days.`
          : `⚠ You don’t have a punishment to appeal.`;
        setStatus(prev => ({ ...prev, [type]: msg }));
      }
    } catch (err) {
      console.error("Eligibility check failed:", err);
      setStatus(prev => ({ ...prev, [type]: "❌ Error checking punishment status." }));
    }
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-12">Punishments Portal</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {boxes.map((box, idx) => (
            <motion.div
              key={box.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-lg p-6 border ${box.bg} shadow-md hover:shadow-xl transition`}
            >
              <img src={box.image} alt={box.title} className="w-52 h-52 object-cover rounded mb-6 mx-auto shadow-lg"/>
              <h2 className="text-2xl font-semibold text-purple-300 text-center mb-2">{box.title}</h2>
              <p className="text-gray-400 text-sm text-center mb-4">{box.description}</p>
              <div className="text-center">
                <button onClick={() => navigate(box.link)} className="inline-block px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded hover:bg-purple-500 transition">
                  View {box.title}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 id="appeals" className="text-2xl font-bold text-purple-400 mb-6">Appeals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {appealBoxes.map((appeal) => (
            <div key={appeal.type} onClick={() => handleAppealClick(appeal.type)} className="bg-[#1e1e22] p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition cursor-pointer">
              <h3 className="text-xl font-semibold text-white mb-2">{appeal.title}</h3>
              <p className="text-gray-400 text-sm mb-2">If you believe a punishment was issued in error, you can submit an appeal here.</p>
              {status[appeal.type] && (
                <p className={`text-sm font-medium flex items-center gap-2 ${status[appeal.type].includes("⚠") || status[appeal.type].includes("❌") ? "text-red-400" : status[appeal.type].includes("✅") ? "text-green-400" : "text-yellow-300"}`}>
                  {(status[appeal.type].includes("⏳") || status[appeal.type].includes("🔗")) && <Spinner />}
                  {status[appeal.type]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default BansPage;
