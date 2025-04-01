import React from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import { useLocation } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, fullWidth = false }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white flex flex-col">
      {/* Header/Navbar layout */}
      <div className="flex flex-col sm:flex-col-reverse">
        <Navbar />
        <Header />
      </div>

      {/* Shared container — allow override */}
      <main
        className={`relative w-full px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 flex-grow ${
          fullWidth ? "" : "max-w-6xl"
        } mx-auto pt-16 pb-12`}
      >
        {!isHome && (
          <div className="absolute top-4 left-2 z-10">
            <Breadcrumbs />
          </div>
        )}

        {children}
      </main>

      <Footer />
    </div>
  );
};

export default PageLayout;
