/** @jsxImportSource react */
import { motion } from "framer-motion";

const DISCORD_URL = import.meta.env.VITE_DISCORD_URL;

const DiscordCTA = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="relative bg-[#1e1e22] border border-gray-700 mt-24 mb-10 rounded-xl shadow-xl overflow-hidden max-w-6xl mx-auto px-6 py-12 sm:py-16 text-center"
    >
      {/* Background Image */}
      <motion.img
        src="/wumpus.png"
        alt="Wumpus"
        className="absolute right-0 bottom-0 max-h-[80%] sm:max-h-full object-contain pointer-events-none opacity-30 sm:opacity-100 transition-opacity duration-700 ease-out"
        initial={{ scale: 0.95 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4"
        >
          Torrent Discord Server
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed"
        >
          Join our Discord community to connect with other players!<br />
          Get the fastest updates here, including our changelog and sneak peaks.<br />
          Our Discord server contains years of memories on Torrent Network.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open(DISCORD_URL, "_blank")}
          className="inline-flex items-center gap-3 px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white text-lg font-semibold rounded-lg transition shadow-md"
        >
          <img src="/discord.png" alt="Discord Logo" className="w-6 h-6" />
          Join Discord
        </motion.button>
      </div>
    </motion.section>
  );
};

export default DiscordCTA;
