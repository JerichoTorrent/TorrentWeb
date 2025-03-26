import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Breadcrumbs from "../components/Breadcrumbs";

const Map = () => {
    return (
      <div className="min-h-screen flex flex-col bg-black">
      <div className="block sm:hidden">
        <Navbar />
        <Header />
      </div>
  
      {/* Desktop: Header above Navbar */}
      <div className="hidden sm:block">
        <Header />
        <Navbar />
      </div>
  
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