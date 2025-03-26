import PageLayout from "../components/PageLayout";

const PlayPage = () => {
  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto text-white py-16 px-4 space-y-16">
        <h1 className="text-4xl font-bold text-yellow-400 text-center">Play on Torrent Network</h1>

        {/* Java Edition */}
        <section className="flex flex-col lg:flex-row items-center gap-10">
          <img
            src="/torrent_java.gif"
            alt="How to join on Java"
            className="w-full rounded-lg shadow-lg border border-[#2d2d34]"
          />
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">Java Edition</h2>
            <ul className="text-left space-y-2 text-lg text-gray-300 list-disc list-inside">
              <li>Click "Multiplayer"</li>
              <li>Click "Add Server"</li>
              <li><strong>Server Name:</strong> Torrent</li>
              <li><strong>Server Address:</strong> torrentsmp.com</li>
              <li>Click "Done" and then click the play button on the server</li>
              <li>Or click "Join Server"</li>
            </ul>
          </div>
        </section>

        {/* Bedrock Edition */}
        <section className="flex flex-col lg:flex-row-reverse items-center gap-10">
          <img
            src="/torrent_bedrock.gif"
            alt="How to join on Bedrock"
            className="w-full rounded-lg shadow-lg border border-[#2d2d34]"
          />
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">Bedrock Edition (PC)</h2>
            <ul className="text-left space-y-2 text-lg text-gray-300 list-disc list-inside">
              <li>Click "Play"</li>
              <li>Go to the "Servers" tab</li>
              <li>Click "Add Server"</li>
              <li><strong>Server Name:</strong> Torrent</li>
              <li><strong>Server Address:</strong> torrentsmp.com</li>
              <li><strong>Port:</strong> 19132 (leave default)</li>
              <li>Click "Play"</li>
            </ul>
          </div>
        </section>

        {/* Trailer */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-purple-300 mb-6">Survival Trailer</h2>
          <div className="aspect-video max-w-3xl mx-auto">
            <iframe
              src="https://www.youtube.com/embed/k1plrdz9a3Y?si=4qdQ3lhq23XgE_5f"
              title="Torrent SMP Survival Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg border border-[#2d2d34]"
            ></iframe>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PlayPage;
