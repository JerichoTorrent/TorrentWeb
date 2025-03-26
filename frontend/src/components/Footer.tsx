import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#111] text-white border-t border-[#2d2d34] px-6 py-12 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
        {/* Left: Logo and About */}
        <div>
          <Link to="/">
            <img src="/torrent_small.png" alt="Torrent Logo" className="h-12 mb-4" />
          </Link>
          <p className="text-gray-400">
            Discover the secrets of alien influence and become immersed in our bleeding edge
            features on Torrent Network. We offer highly developed cross-play Minecraft servers
            with ZERO LAG.
          </p>
        </div>

        {/* Center: Useful Links */}
        <div>
          <h3 className="text-purple-300 font-semibold mb-4">Useful Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><Link to="/terms" className="hover:text-yellow-400 transition">Terms and Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link></li>
            <li><a href="https://status.torrentsmp.com" className="hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Status</a></li>
            <li><a href="https://wiki.torrentsmp.com" className="hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Wiki</a></li>
            <li><Link to="/rules" className="hover:text-yellow-400 transition">Rules</Link></li>
          </ul>
        </div>

        {/* Right: Store */}
        <div>
          <h3 className="text-purple-300 font-semibold mb-4">Store</h3>
          <a
            href="https://store.torrentsmp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-yellow-400 text-black font-semibold px-4 py-2 rounded hover:bg-purple-500 hover:text-white transition"
          >
            Visit the Store
          </a>
        </div>
      </div>

      {/* Bottom Row: Legal & Credit */}
      <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500">
        <div>
          <p>Copyright © Torrent Network 2023-2025. All Rights Reserved.</p>
          <p className="mt-1">NOT AN OFFICIAL MINECRAFT SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
        </div>
        <div className="text-right">
          <p>Designed by Brevex Media & Design.</p>
          <a
            href="https://brevexmedia.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/brevex.png" alt="Brevex Logo" className="h-8 mt-2 ml-auto" />
          </a>
        </div>
      </div>

      {/* Social Icons */}
      <div className="mt-10 flex justify-center gap-6">
        {[
          { icon: "discord.png", url: "https://discord.gg/torrent" },
          { icon: "youtube.png", url: "https://www.youtube.com/@jerichotorrent" },
          { icon: "tiktok.png", url: "https://www.tiktok.com/@torrentnetwork" },
          { icon: "instagram.png", url: "https://www.instagram.com/torrentsmp/" },
          { icon: "reddit.png", url: "https://www.reddit.com/r/torrentnetwork/" },
          { icon: "github.png", url: "https://github.com/JerichoTorrent" },
        ].map(({ icon, url }, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="transform transition-transform duration-300 hover:scale-110"
          >
            <img src={`/${icon}`} alt={icon} className="h-8 w-8" />
          </a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;