/** @jsxImportSource react */
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.twofaRequired) {
          // Redirect to 2FA page with info
          navigate("/login/2fa", {
            state: {
              uuid: data.uuid,
              username: data.username,
              method: data.method,
            },
          });
          return;
        }
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("uuid", data.user.uuid);
        login(data.token);
        setMessage("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMessage(`❌ ${data.error || "Login failed."}`);
        if (data.error === "Email not verified.") {
          setShowResend(true);
          setCooldown(60);
        }
      }
    } catch {
      setMessage("❌ Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!username) return;
    setResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }), // patched this a month later lol
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
    <PageLayout fullWidth>
      <div className="flex flex-col items-center justify-center min-h-[70vh] mt-4 sm:mt-0">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2">
          Login to Torrent Network
        </h2>

        <div className="bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-6">
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
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {message && (
              <p
                className={`text-sm text-center mt-2 ${
                  message.startsWith("✅")
                    ? "text-green-400"
                    : "text-red-400"
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

            {showResend && (
              <div className="text-center mt-3 text-sm text-gray-400">
                Didn’t get a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-purple-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {resending ? "Resending..." : `Resend Email${cooldown > 0 ? ` (${cooldown})` : ""}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;
