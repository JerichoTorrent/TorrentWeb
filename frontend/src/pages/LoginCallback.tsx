/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoginCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setMessage("❌ Invalid or missing verification token.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setMessage("✅ Email verified! Redirecting...");
          setTimeout(() => navigate("/verify-success"), 2000);
        } else {
          setMessage(`❌ Error: ${data.error}`);
        }
      } catch (error) {
        setMessage("❌ Server error. Please try again.");
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h2 className="text-2xl font-bold">{message}</h2>
    </div>
  );
};

export default LoginCallback;
