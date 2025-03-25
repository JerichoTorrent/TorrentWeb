import Header from "../components/Header";
import Navbar from "../components/Navbar";

const Map = () => {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Header />
        <Navbar />
  
        <div className="flex-grow">
          <iframe
            src="https://map.torrentsmp.com"
            title="Torrent SMP Map"
            className="w-full h-[calc(100vh-150px)] border-none"
            allowFullScreen
          />
        </div>
      </div>
    );
  };
  
  export default Map;