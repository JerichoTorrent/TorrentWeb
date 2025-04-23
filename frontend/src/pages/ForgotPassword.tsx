/** @jsxImportSource react */
import { useState } from "react";
import PageLayout from "../components/PageLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Password reset link sent! Please check your email.");
        setEmail("");
      } else {
        setMessage(`❌ ${data.error || "Failed to send reset email."}`);
      }
    } catch {
      setMessage("❌ Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col items-center justify-center min-h-[70vh] mt-4 sm:mt-0">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10 text-center leading-tight pt-2">
          Reset Your Password
        </h2>

        <div className="bg-[#1f1f1f] p-10 w-full max-w-md rounded-xl border border-[#2d2d34] shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-5 py-4 w-full text-lg rounded-md placeholder-gray-400 text-white bg-[#2a2a2e] border border-[#5b5b64] focus:outline-none focus:border-yellow-400 transition-all"
            />

            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-4 w-full text-lg font-semibold text-black bg-yellow-400 rounded-md shadow-md transition-all ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(128,0,255,0.8)]"
              }`}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
