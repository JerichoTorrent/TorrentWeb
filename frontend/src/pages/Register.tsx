/** @jsxImportSource react */
import { useState, useEffect } from "react";
import { registerUser } from "../api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (showResend && cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResend, cooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    const result = await registerUser(username, email, password);

    if (result.success) {
      setMessage("✅ Verification email sent! Please check your inbox.");
      setShowResend(true);
      setCooldown(60);
      setUsername("");
      setPassword("");
    } else {
      setMessage(`❌ ${result.error}`);
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Verification email resent!");
        setCooldown(60);
      } else {
        setMessage(`❌ ${data.error || "Resend failed."}`);
      }
    } catch {
      setMessage("❌ Server error. Could not resend verification email.");
    } finally {
      setResending(false);
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
          Register for Torrent Network
        </h2>

        <div className="relative bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleRegister} className="relative flex flex-col gap-6">
            <input
              type="text"
              placeholder="Minecraft Username"
              className="px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-purple-500 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              className="px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-yellow-400 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="submit"
              className={`px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md transition-all ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Register"}
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

            {showResend && (
              <div className="text-center mt-3 text-sm text-gray-400">
                Didn’t get a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-purple-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {resending ? "Resending..." : `Send me another${cooldown > 0 ? ` (${cooldown})` : ""}`}
                </button>
              </div>
            )}
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm mb-2">Already have an account?</p>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md hover:shadow-[0_0_15px_rgba(128,0,255,0.8)] transition-all"
            >
              Login now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
