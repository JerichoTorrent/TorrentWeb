import { Link } from "react-router-dom";

const SplashHero = () => {
  return (
    <div className="relative w-full left-0 top-0 -mx-auto">
      <div className="relative w-screen h-[90vh] overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/splash.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-64 z-10 pointer-events-none bg-gradient-to-b from-transparent to-[#0e0e10]" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-xl">
            How Minecraft should be played.
          </h1>
          <Link
            to="/play"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 text-lg rounded-full font-semibold transition"
          >
            Join Now
          </Link>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#121212] to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
};

export default SplashHero;
