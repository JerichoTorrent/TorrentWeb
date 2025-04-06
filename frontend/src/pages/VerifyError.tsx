import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const VerifyError = () => {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Verification Failed</h1>
        <p className="text-gray-300 mb-6">
          ⚠ The email verification link you used is either invalid or has expired.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded transition"
        >
          Back to Register
        </button>
      </div>
    </PageLayout>
  );
};

export default VerifyError;
