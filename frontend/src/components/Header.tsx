/** @jsxImportSource react */
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../context/AuthContext";
import { logoutUser } from "../api";
import ParticleBackground from "./ParticleBackground";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MCSTATUS_URL = import.meta.env.VITE_MCSTATUS_URL;
const DISCORD_URL = import.meta.env.VITE_DISCORD_URL;

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [discordMembers, setDiscordMembers] = useState<number | null>(null);
  const [minecraftPlayers, setMinecraftPlayers] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/discord/preview`)
      .then((res) => res.json())
      .then((data) => setDiscordMembers(data?.approximate_member_count ?? null))
      .catch(() => setDiscordMembers(null));
  }, []);

  useEffect(() => {
    fetch(MCSTATUS_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data?.online && typeof data.players?.online === "number") {
          setMinecraftPlayers(data.players.online);
        } else {
          setMinecraftPlayers(null);
        }
      })
      .catch(() => setMinecraftPlayers(null));
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    logoutUser();
    logout();
    navigate("/");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("torrentsmp.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative z-50 border-b border-[#2d2d34] shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
      <div className="relative z-10 px-6 pt-4 pb-4 text-white flex flex-col items-center">
        {/* Login/Profile Row */}
        <div className="w-full justify-end hidden sm:flex">
          {!user ? (
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-black rounded shadow hover:shadow-[0_0_10px_rgba(128,0,255,0.7)] transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-black rounded shadow hover:shadow-[0_0_10px_rgba(128,0,255,0.7)] transition"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black font-semibold rounded shadow hover:shadow-[0_0_10px_rgba(128,0,255,0.7)] transition"
              >
                <div className="w-6 h-6 bg-gray-700 rounded-md" />
                <span>{user.username}</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1f1f1f] border border-[#2d2d34] shadow-lg rounded-lg p-4 text-sm text-white z-50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-md" />
                    <div className="text-right">
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setOpen(false);
                        }}
                        className="font-semibold text-yellow-400 hover:underline"
                      >
                        {user.username}
                      </button>
                      <div className="text-xs text-gray-400">Badge: Crafter</div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full mb-3 relative overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: "45%" }} />
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Level 7</p>
                  <div className="border-t border-gray-700 my-3" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => { navigate("/dashboard"); setOpen(false); }} className="text-left hover:text-yellow-400">View my profile</button>
                    <button onClick={() => setOpen(false)} className="text-right hover:text-yellow-400">Following</button>
                    <button onClick={() => setOpen(false)} className="text-left hover:text-yellow-400">News feed</button>
                    <button onClick={() => setOpen(false)} className="text-right hover:text-yellow-400">Blocked</button>
                  </div>
                  <div className="border-t border-gray-700 my-3" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm font-semibold text-black bg-yellow-400 rounded shadow hover:shadow-[0_0_10px_rgba(128,0,255,0.7)] transition"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Logo + Buttons */}
        <div className="relative w-full max-w-5xl mt-4 mb-6 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-6 sm:gap-0">
          {/* Left - Discord */}
          <div className="sm:absolute sm:left-0 flex justify-center sm:justify-start">
            <button
              onClick={() => window.open(`${DISCORD_URL}`, "_blank")}
              className="flex items-center gap-2 px-5 py-3 text-base bg-[#2a2a2e] text-yellow-400 rounded shadow hover:text-purple-400 hover:shadow-md transition"
            >
              <img src="/discord.png" alt="Discord" className="w-6 h-6" />
              {typeof discordMembers === "number"
                ? `${discordMembers} members`
                : "Join Discord"}
            </button>
          </div>

          {/* Center - Logo */}
          <div className="flex justify-center">
            <img
              src="/torrent_logo.png"
              alt="Torrent Logo"
              className="h-[12rem] sm:h-[12rem] mx-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Right - Server IP */}
          <div className="sm:absolute sm:right-0 flex flex-col items-center sm:items-end">
            <button
              onClick={handleCopy}
              className="px-5 py-3 text-base bg-[#2a2a2e] text-yellow-400 rounded shadow hover:text-purple-400 hover:shadow-md transition"
            >
              Server IP » torrentsmp.com
            </button>
            <p className="mt-1 absolute top-full text-sm sm:text-base text-gray-400">
              {minecraftPlayers !== null ? `${minecraftPlayers} players online` : ""}
            </p>
            <span
              className={`text-xs text-green-400 mt-1 transition-opacity duration-300 ${
                copied ? "opacity-100" : "opacity-0"
              }`}
            >
              Copied!
            </span>
          </div>
        </div>
      </div>

      {/* Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img src="/sheep_corp.png" alt="Header Background" className="w-full h-full object-cover" />
        <ParticleBackground />
        <div className="absolute inset-0 bg-[#1f1f1f]/50 backdrop-blur-sm" />
      </div>
    </div>
  );
};

export default Header;