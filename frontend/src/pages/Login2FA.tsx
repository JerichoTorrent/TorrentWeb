/** @jsxImportSource react */
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login2FA = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { uuid, username, method } = location.state || {};

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!uuid || !method) {
      navigate("/login");
    }
  }, [uuid, method, navigate]);

  const handleVerify = async () => {
    if (!code || isLoading) return;
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, token: code }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("uuid", data.user.uuid);
        login(data.token);
        setMessage("✅ Login verified! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage(`❌ ${data.error || "Invalid code."}`);
      }
    } catch {
      setMessage("❌ Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const methodLabel = method === "totp" ? "Authenticator App" : "Email";

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col items-center justify-center min-h-[70vh] mt-4 sm:mt-0">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2">
          Enter 2FA Code
        </h2>

        <div className="bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <div className="text-center mb-6">
            <p className="text-gray-300 text-lg mb-1">Hi <span className="text-purple-300 font-semibold">{username}</span>,</p>
            <p className="text-sm text-gray-400">Enter the 6-digit code from your <span className="text-yellow-400 font-medium">{methodLabel}</span>.</p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="mb-4 px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-yellow-400 transition-all text-center tracking-widest"
          />

          <button
            onClick={handleVerify}
            disabled={isLoading}
            className={`px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md transition-all ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
            }`}
          >
            {isLoading ? "Verifying..." : "Verify and Login"}
          </button>

          {message && (
            <p
              className={`text-sm text-center mt-4 ${
                message.startsWith("✅") ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Login2FA;
