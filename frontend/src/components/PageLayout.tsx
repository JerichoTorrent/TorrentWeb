import React from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import Breadcrumbs from "./Breadcrumbs";

interface PageLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white">
      {/* Header/Navbar layout */}
      <div className="block sm:hidden">
        <Navbar />
        <Header />
      </div>
      <div className="hidden sm:block">
        <Header />
        <Navbar />
      </div>

      {/* Shared container — allow override */}
      <div
        className={`relative w-full px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 ${
          fullWidth ? "" : "max-w-6xl"
        } mx-auto pt-16 pb-12`}
      >
        <div className="absolute top-4 left-2 z-10">
          <Breadcrumbs />
        </div>

        {children}
      </div>
    </div>
  );
};

export default PageLayout;
