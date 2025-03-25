/** @jsxImportSource react */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useContext } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setMessage("");

    if (!username || !password) {
      setMessage("❌ Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("uuid", data.user.uuid);
        login(data.token);
        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMessage(`❌ ${data.error || "Login failed."}`);
      }
    } catch {
      setMessage("❌ Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="flex flex-col items-center justify-center min-h-screen md:-mt-16">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2">
          Login to Torrent Network
        </h2>

        <div className="relative bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <div className="relative flex flex-col gap-6">
            <input
              type="text"
              placeholder="Minecraft Username"
              className="px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-purple-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-yellow-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              onClick={handleLogin}
              className={`px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md transition-all ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {message && (
              <p
                className={`text-sm text-center mt-2 ${
                  message.startsWith("✅") ? "text-green-400" : "text-red-400"
                } animate-fade-in`}
              >
                {message}
              </p>
            )}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-purple-400 hover:text-yellow-300 transition-all mb-6 block text-lg"
            >
              Forgot password?
            </button>
            <p className="text-sm mb-4">Don't have an account?</p>
            <button
              onClick={() => navigate("/register")}
              className="px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md hover:shadow-[0_0_15px_rgba(128,0,255,0.8)] transition-all"
            >
              Register now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
