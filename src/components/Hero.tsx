import { Copy, Users } from 'lucide-react';
import { useState } from 'react';

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const serverIP = 'torrentsmp.com';
  const onlinePlayers = 20;

  const copyIP = () => {
    navigator.clipboard.writeText(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-6 sm:px-12 py-12">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
          aria-hidden="true"
        >
          <source src="/video/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/80 to-gray-900"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight text-white">
          <span className="title-gradient">Torrent Network</span>
        </h1>
        <h2 className="text-xl sm:text-2xl font-light text-gray-300">
          Where Escapism Goes to Die
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6">
          <button
            onClick={copyIP}
            className="group relative flex items-center gap-2 px-6 py-3 glass-card rounded-xl hover:bg-red-500/20 hover:scale-105 transition-all duration-300"
            aria-label="Copy Server IP"
          >
            <Copy className="w-5 h-5 text-red-400" />
            <span className="text-gray-200">{copied ? 'Copied!' : serverIP}</span>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-card px-3 py-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
              <Users className="inline w-4 h-4 mr-1 text-red-400" />
              <span className="text-gray-300">{onlinePlayers} players online</span>
            </div>
          </button>

          <a
            href="https://discord.gg/torrent"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 glass-card rounded-xl hover:bg-indigo-500/20 hover:scale-105 transition-all duration-300 text-gray-200"
            aria-label="Join Discord"
          >
            Join Discord
          </a>

          <button
            className="px-6 py-3 glass-card rounded-xl bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 hover:scale-105 transition-all duration-300 text-yellow-300"
            aria-label="Support Us"
          >
            Support Us
          </button>
        </div>

        {/* Description */}
        <p className="max-w-3xl mx-auto text-gray-300 text-lg leading-relaxed">
          Join the most immersive Minecraft experience with custom plugins,
          active community, and endless possibilities.
        </p>
      </div>
    </div>
  );
}
