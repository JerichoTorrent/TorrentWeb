/** @jsxImportSource react */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("❌ Invalid or missing reset link.");
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("❌ Missing reset token.");
      return;
    }

    if (password !== confirm) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Password reset successful! Redirecting...");
        setTimeout(() => navigate("/reset-success"), 1500);
      } else {
        setMessage(`❌ ${data.error || "Reset failed."}`);
        if (data.error?.toLowerCase().includes("expired") || data.error?.toLowerCase().includes("invalid")) {
          setTimeout(() => navigate("/forgot-password"), 3000);
        }
      }
    } catch {
      setMessage("❌ Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col items-center justify-center min-h-[70vh] mt-0 sm:mt-0">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2">
          Reset Your Password
        </h2>

        <div className="bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-5 py-4 w-full text-lg rounded-md bg-[#2a2a2e] text-white border border-[#5b5b64] placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="px-5 py-4 w-full text-lg rounded-md bg-[#2a2a2e] text-white border border-[#5b5b64] placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all"
              required
            />

            <button
              type="submit"
              className={`px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md transition-all ${
                submitting ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
              }`}
              disabled={submitting}
            >
              {submitting ? "Resetting..." : "Reset Password"}
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
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default ResetPassword;
