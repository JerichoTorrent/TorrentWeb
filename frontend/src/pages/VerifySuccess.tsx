/** @jsxImportSource react */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const VerifySuccess = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      login(token); // Update global context
      setTimeout(() => navigate("/"), 1500);
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white px-4 text-center">
      <h1 className="text-4xl font-bold text-green-400 mb-4">✅ Email Verified!</h1>
      <p className="text-lg text-gray-300 mb-6">You're being logged in automatically.</p>
      <p className="text-sm text-gray-500">(Redirecting to homepage...)</p>
    </div>
  );
};

export default VerifySuccess;
