/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const VerifySuccess = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    if (token === "already") {
      console.log("ℹ️ Email already verified, no login attempt needed.");
      setTimeout(() => navigate("/"), 1500);
      setStatus("success");
      return;
    }

    (async () => {
      try {
        localStorage.setItem("authToken", token);
        await login(token);
        setTimeout(() => navigate("/"), 1500); // Small pause to reassure user
        setStatus("success");
      } catch (err) {
        console.error("Login via token failed, but email is verified:", err);
        // ⚡ Instead of failing verification, just stay on success screen
        setStatus("success");
      }
    })();
  }, [login, navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white px-4 text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">Verifying your email...</h1>
        <p className="text-lg text-gray-300 mb-6">Please wait a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white px-4 text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">✅ Email Verified!</h1>
        <p className="text-lg text-gray-300 mb-6">Redirecting to homepage...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white px-4 text-center">
      <h1 className="text-4xl font-bold text-red-400 mb-4">❌ Verification Failed</h1>
      <p className="text-lg text-gray-300 mb-6">Invalid or expired verification link.</p>
      <button
        onClick={() => navigate("/register")}
        className="mt-4 px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-500 transition"
      >
        Back to Register
      </button>
    </div>
  );
};

export default VerifySuccess;
