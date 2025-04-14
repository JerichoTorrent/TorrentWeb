import { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Navbar = () => {
  const [forumsOpen, setForumsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const forumsRef = useRef<HTMLLIElement | null>(null);
  const moreRef = useRef<HTMLLIElement | null>(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const closeMenus = (e: MouseEvent) => {
      if (forumsRef.current && !forumsRef.current.contains(e.target as Node)) setForumsOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-[#1f1f1f] text-white shadow-md z-40 relative">
      <div className="flex justify-between items-center px-6 py-3">
        {/* Hamburger */}
        <button
          className="text-yellow-400 text-3xl sm:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>

        {/* Centered Nav (desktop only) */}
        <ul className="hidden sm:flex flex-1 justify-center gap-10 items-center text-base font-semibold">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/stats">Stats</NavItem>
          <NavItem to="/rules">Rules</NavItem>
          <li className="relative" ref={forumsRef}>
            <button
              onClick={() => setForumsOpen(!forumsOpen)}
              className="hover:text-purple-400 transition"
            >
              Forums ▾
            </button>
            {forumsOpen && (
              <ul className="absolute top-full left-0 mt-2 bg-[#2a2a2e] text-sm rounded shadow-lg py-2 z-50">
                <DropdownItem to="/forums">Forum Home</DropdownItem>
                <DropdownItem to="/forums/latest">Latest Posts</DropdownItem>
                <DropdownItem to="/forums/search">Search</DropdownItem>
              </ul>
            )}
          </li>
          <NavItem to="/vote">Vote</NavItem>
          <NavItem to="/blog">Blog</NavItem>
          <a
            href="https://wiki.torrentsmp.com"
            className="hover:text-purple-400 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wiki
          </a>
          <NavItem to="/map">Map</NavItem>
          <li className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="hover:text-purple-400 transition"
            >
              More ▾
            </button>
            {moreOpen && (
              <ul className="absolute top-full left-0 mt-2 bg-[#2a2a2e] text-sm rounded shadow-lg py-2 z-50">
                <DropdownItem to="/affiliates">Affiliates</DropdownItem>
                <DropdownItem to="/bans">Bans</DropdownItem>
                <DropdownItem to="/play">Play</DropdownItem>
              </ul>
            )}
          </li>
        </ul>

        {/* Store Link */}
        <a
          href="https://store.torrentsmp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-yellow-400 text-black rounded shadow hover:bg-purple-500 hover:text-white transition font-semibold"
        >
          Store
        </a>
      </div>

      {/* Mobile Menu */}
      <div
        className={`sm:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-[1000px] py-4" : "max-h-0"
        } bg-[#1f1f1f] border-t border-[#2d2d34]`}
      >
        <ul className="flex flex-col items-center gap-4 text-base font-semibold">
          {[
            ["/", "Home"],
            ["/stats", "Stats"],
            ["/rules", "Rules"],
            ["/forums", "Forums"],
            ["/vote", "Vote"],
            ["/blog", "Blog"],
            ["/map", "Map"],
            ["/affiliates", "Affiliates"],
            ["/bans", "Bans"],
            ["/play", "Play"],
          ].map(([path, label]) => (
            <li key={path}>
              <button
                onClick={() => handleNavClick(path)}
                className="hover:text-purple-400 transition"
              >
                {label}
              </button>
            </li>
          ))}
          <a
            href="https://wiki.torrentsmp.com"
            className="hover:text-purple-400 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wiki
          </a>
        </ul>

        {/* Auth Actions */}
        <div className="mt-6 px-6 flex flex-col gap-3">
          {!user ? (
            <>
              <button
                onClick={() => handleNavClick("/login")}
                className="w-full py-2 bg-yellow-400 text-black rounded shadow hover:bg-purple-500 hover:text-white transition"
              >
                Login
              </button>
              <button
                onClick={() => handleNavClick("/register")}
                className="w-full py-2 bg-yellow-400 text-black rounded shadow hover:bg-purple-500 hover:text-white transition"
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick("/dashboard")}
                className="w-full py-2 bg-[#2a2a2e] text-yellow-400 rounded shadow hover:text-purple-400 hover:shadow-md transition"
              >
                My Dashboard
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
                className="w-full py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link to={to} className="hover:text-purple-400 transition">
    {children}
  </Link>
);

const DropdownItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="block px-4 py-2 hover:bg-purple-500 hover:text-white transition whitespace-nowrap"
  >
    {children}
  </Link>
);

export default Navbar;
