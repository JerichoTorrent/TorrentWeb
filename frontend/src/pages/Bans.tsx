import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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

const BansPage = () => {
  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-12">Punishments Portal</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {boxes.map((box, idx) => (
            <motion.div
              key={box.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-lg p-6 border ${box.bg} shadow-md hover:shadow-xl transition`}
            >
              <img
                src={box.image}
                alt={box.title}
                className="w-52 h-52 object-cover rounded mb-6 mx-auto shadow-lg"
              />
              <h2 className="text-2xl font-semibold text-purple-300 text-center mb-2">
                {box.title}
              </h2>
              <p className="text-gray-400 text-sm text-center mb-4">
                {box.description}
              </p>
              <div className="text-center">
                <Link
                  to={box.link}
                  className="inline-block px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded hover:bg-purple-500 transition"
                >
                  View {box.title}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default BansPage;
