/** @jsxImportSource react */
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const ResetSuccess = () => {
  const navigate = useNavigate();

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-4xl font-bold text-green-400 mb-4">✅ Password Reset Successful</h1>
        <p className="text-gray-300 text-lg mb-6">
          You can now log in using your new password.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 text-lg font-semibold text-black bg-yellow-400 rounded shadow hover:shadow-[0_0_15px_rgba(128,0,255,0.8)] transition"
        >
          Back to Login
        </button>
      </div>
    </PageLayout>
  );
};

export default ResetSuccess;
