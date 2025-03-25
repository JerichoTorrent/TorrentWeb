import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white">
      {/* Mobile: Navbar above Header */}
      <div className="block sm:hidden">
        <Navbar />
        <Header />
      </div>
  
      {/* Desktop: Header above Navbar */}
      <div className="hidden sm:block">
        <Header />
        <Navbar />
      </div>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2 md:mt-16">Welcome to Torrent Network!</h1>
      </div>
    </div>
  );
};

export default Home;
