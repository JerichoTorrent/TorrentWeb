/** @jsxImportSource react */
import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SecuritySection = () => {
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [message, setMessage] = useState("");

  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/2fa/status`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        setAuthenticatorEnabled(data.twofa_method === "totp" && data.twofa_enabled);
      } catch (err) {
        console.error("Failed to fetch 2FA status", err);
      }
    };

    fetchStatus();
  }, [authToken]);

  const beginSetup = async () => {
    setMessage("");
    setShowSetup(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err) {
      console.error("Failed to begin 2FA setup", err);
      setMessage("❌ Failed to begin setup.");
    }
  };

  const handleVerifyToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenInput }),
      });

      if (res.ok) {
        setMessage("✅ 2FA successfully enabled!");
        setAuthenticatorEnabled(true);
        setShowSetup(false);
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.error || "Verification failed."}`);
      }
    } catch (err) {
      console.error("Verify error", err);
      setMessage("❌ Server error during verification.");
    }
  };

  const handleDisable = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/2fa/disable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        setMessage("✅ 2FA has been disabled.");
        setAuthenticatorEnabled(false);
        setShowSetup(false);
      } else {
        setMessage("❌ Failed to disable 2FA.");
      }
    } catch (err) {
      console.error("Disable error", err);
      setMessage("❌ Server error while disabling 2FA.");
    }
  };

  return (
    <div className="bg-[#1e1e22] border border-gray-700 rounded-xl p-6 shadow-lg space-y-8">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Security Settings</h2>

      {/* Password Reset */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-purple-300">Reset Your Password</h3>
        <p className="text-gray-400 text-sm">
          Forgot your password or want to change it? Click below to start the reset process.
        </p>
        <a
          href="/forgot-password"
          className="inline-block bg-yellow-400 text-black px-4 py-2 rounded shadow hover:bg-purple-500 hover:text-white transition"
        >
          Reset Password
        </a>
      </div>

      <hr className="border-gray-700" />

      {/* Authenticator App Setup */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-purple-300">Authenticator App</h3>
            <p className="text-gray-400 text-sm">
              Use an app like Google Authenticator or Authy to scan a QR code and protect your account.
            </p>
          </div>

          {authenticatorEnabled ? (
            <button
              onClick={handleDisable}
              className="px-4 py-2 text-sm font-semibold rounded bg-green-600 text-white hover:bg-green-700 transition"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={beginSetup}
              className="px-4 py-2 text-sm font-semibold rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
            >
              Enable
            </button>
          )}
        </div>

        {authenticatorEnabled && (
          <div className="text-sm text-green-400">Authenticator 2FA is active on your account.</div>
        )}

        {showSetup && !authenticatorEnabled && (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-300">
              Scan this QR code in your authenticator app, then enter the 6-digit code below:
            </div>
            {qrCode && <img src={qrCode} alt="QR Code" className="w-40 h-40 mx-auto" />}
            <input
              type="text"
              placeholder="123456"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-2 rounded bg-[#2a2a2e] border border-gray-600 text-white text-center tracking-widest"
            />
            <button
              onClick={handleVerifyToken}
              className="w-full px-4 py-2 text-sm font-semibold text-black bg-yellow-400 rounded hover:bg-purple-600 hover:text-white transition"
            >
              Verify Code & Enable
            </button>
          </div>
        )}
      </div>

      {message && (
        <p
          className={`text-sm text-center ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default SecuritySection;
