import PageLayout from "../components/PageLayout";

const voteSites = [
  { name: "FindMCServer", url: "https://findmcserver.com/server/torrent" },
  { name: "MinecraftBestServers", url: "https://minecraftbestservers.com/server-torrent.596/" },
  { name: "Best Minecraft Servers", url: "https://best-minecraft-servers.co/server-torrent-network.18756/vote" },
  { name: "MinecraftServers.org", url: "https://minecraftservers.org/vote/654203" },
  { name: "Servers-Minecraft.net", url: "https://servers-minecraft.net/server-torrent-network.25769" },
  { name: "Minecraft Server List", url: "https://minecraft-server-list.com/server/495432/vote/" },
  { name: "TopMinecraftServers", url: "https://topminecraftservers.org/vote/33820" },
  { name: "MinecraftBuzz", url: "https://minecraft.buzz/vote/9708" },
  { name: "Minecraft.menu", url: "https://minecraft.menu/server-torrent-network.3376/vote" },
  { name: "PlanetMinecraft", url: "https://www.planetminecraft.com/server/quantumcraft-smp-java-server-1-19-3/vote/" },
  { name: "Minecraft-MP", url: "https://minecraft-mp.com/server/320527/vote/" },
  { name: "Play Minecraft Servers", url: "https://play-minecraft-servers.com/minecraft-servers/torrent-network/?tab=vote" },
  { name: "Minecraft-Server.net", url: "https://minecraft-server.net/vote/Torrent/" },
  { name: "MinecraftList.org", url: "https://minecraftlist.org/vote/31023" },
  { name: "Top MC Servers", url: "https://top-mc-servers.net/server/334" },
  { name: "MineBrowse", url: "https://minebrowse.com/server/5381" },
  { name: "MC Server Time", url: "https://mcservertime.com/server-torrent-network.2169/vote" },
  { name: "TrackyServer", url: "https://www.trackyserver.com/server/2507118#vote" },
];

const Vote = () => {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Panel */}
        <div className="bg-[#1f1f1f] rounded-lg shadow-lg p-8 space-y-8">
          <h1 className="text-4xl font-bold text-yellow-400 text-center">Vote</h1>
          <p className="text-lg leading-relaxed">
            Vote for <span className="text-yellow-400">Torrent Network</span> on these sites with your Minecraft username.
            Voting allows you to receive rewards in <span className="text-green-400">/voteshop</span>.
            Bedrock players should input a dot (.) before their username like it appears on the server.
          </p>

          {/* Red Divider */}
          <div className="border-t border-red-600" />

          <h2 className="text-2xl font-semibold mt-4 text-center">Voting Sites</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {voteSites.map((site) => (
              <a
                key={site.url}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2a2a2e] hover:bg-purple-600 text-white text-center py-3 px-4 rounded transition shadow"
              >
                {site.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Vote;
