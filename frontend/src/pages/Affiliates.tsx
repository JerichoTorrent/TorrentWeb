import { useState } from "react";
import PageLayout from "../components/PageLayout";

const Affiliates = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("mc.minehut.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4 text-white">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-12">Our Affiliates</h1>

        <div className="bg-[#1f1f1f] border border-[#2d2d34] rounded-lg shadow-lg p-6 space-y-12">

          {/* Brevex */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <img src="/brevex.png" alt="Brevex Logo" className="h-32 md:h-20" />
            <div>
              <h2 className="text-xl font-semibold text-purple-300">Brevex Media & Design</h2>
              <p className="text-gray-300 mt-1">
                We deliver clients. Full stack and responsive websites, punchy graphic design, expert-level SEO
                and high conversion ads for a fraction of the price.
              </p>
              <p className="text-gray-400 italic mt-2">
                Offered consultancy and contributed to the development of this website.
              </p>
              <a
                href="https://brevexmedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-yellow-400 transition text-sm"
              >
                https://brevexmedia.com
              </a>
            </div>
          </div>

          <div className="border-t border-[#333]" />

          {/* Minehut */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <img src="/minehut.png" alt="Minehut Logo" className="h-32 md:h-20" />
            <div>
              <h2 className="text-xl font-semibold text-purple-300">Minehut</h2>
              <p className="text-gray-300 mt-1">
                The best free Minecraft servers host that lets you play with friends, customize, and get
                discovered on the best Minecraft server list.
              </p>
              <p className="text-gray-400 italic mt-2">
                Through our official partnership with Minehut and Gamersafer, we have been able to collaborate
                and feature our network on Minecraft's official server list,
                <a
                  href="https://findmcserver.com/server/torrent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-yellow-400 ml-1"
                >
                  https://findmcserver.com/server/torrent
                </a>
              </p>
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleCopy}
                  className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded hover:bg-purple-500 hover:text-white transition"
                >
                  {copied ? "Copied!" : "Copy IP: mc.minehut.com"}
                </button>
                <span className="text-gray-400">/join torrent</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#333]" />

          {/* TerraByteDev */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <img src="/terrabytedev.png" alt="TerraByteDev Logo" className="h-32 md:h-20" />
            <div>
              <h2 className="text-xl font-semibold text-purple-300">TerraByteDev</h2>
              <p className="text-gray-300 mt-1">
                Hey, we're TerraByteDev, a small, passionate development studio. We're dedicated towards crafting
                innovative plugins and tools for the public. We stride towards innovation and aim to bring creative
                solutions to the community. We are committed to building high-quality plugins and tools that empower
                users, enhance productivity and push the boundaries of what is possible.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <a
                  href="https://docs.terrabytedev.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-yellow-400 transition text-sm"
                >
                  https://docs.terrabytedev.com
                </a>
                <a
                  href="https://discord.gg/xm865zeQQn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded hover:bg-[#4752C4] transition"
                >
                  <img src="/discord.png" alt="Discord" className="h-5 w-5" />
                  Join Discord
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
};

export default Affiliates;