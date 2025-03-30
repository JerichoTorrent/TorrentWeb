import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, FormEvent, useContext } from "react";
import AuthContext from "../context/AuthContext";
import PageLayout from "../components/PageLayout"; // ✅ Added import

const typeLabels: Record<string, string> = {
  "minecraft-ban": "Minecraft Ban Appeal",
  "minecraft-mute": "Minecraft Mute Appeal",
  "discord": "Discord Appeal"
};

const AppealFormPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  const label = typeLabels[type || ""] || "Invalid Appeal Type";

  useEffect(() => {
    if (!type || !typeLabels[type] || !user?.token) {
      setIsEligible(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/appeals/check-eligibility?type=${type}`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      },
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setIsEligible(data.eligible);
        if (data.eligible === false && data.cooldown) {
          setCooldownSeconds(data.cooldown);
        }
        setLoading(false);
      })
      .catch(() => {
        setIsEligible(false);
        setLoading(false);
      });
  }, [type, user]);

  useEffect(() => {
    if (cooldownSeconds === null) return;

    const interval = setInterval(() => {
      setCooldownSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user?.token) {
      setError("You must be logged in to submit an appeal.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError(null);

    const formData = new FormData();
    formData.append("type", type!);
    formData.append("message", message);
    if (files) {
      Array.from(files).forEach(file => formData.append("files", file));
    }

    const res = await fetch("/api/appeals/submit", {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${user.token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      setStatus("success");
      setTimeout(() => navigate("/appeals/my"), 1500);
    } else {
      setStatus("error");
      setError(data.error || "Something went wrong.");
    }
  };

  return (
    <PageLayout> {/* ✅ Clearly wrap with PageLayout here */}
      {!type || !typeLabels[type] ? (
        <p className="text-center text-red-500 py-20">Invalid appeal type.</p>
      ) : loading ? (
        <p className="text-center text-gray-400 py-20">Checking appeal eligibility...</p>
      ) : !isEligible ? (
        <div className="max-w-xl mx-auto text-center py-20 text-gray-400">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Not Eligible</h1>
          <p className="mb-2">You are not eligible to submit a {label.toLowerCase()} at this time.</p>
          {cooldownSeconds !== null && cooldownSeconds > 0 && (
            <p className="text-sm text-gray-500">
              Try again in <span className="text-yellow-400 font-medium">{cooldownSeconds}</span> seconds.
            </p>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold text-purple-400 mb-6">{label}</h1>

          {status === "success" && (
            <div className="bg-green-700 text-green-100 text-sm px-4 py-3 rounded mb-6">
              ✅ Your appeal has been submitted! Redirecting...
            </div>
          )}

          {status === "error" && error && (
            <div className="bg-red-700 text-red-100 text-sm px-4 py-3 rounded mb-6">
              ❌ {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Why are you appealing?</label>
              <textarea
                required
                className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Explain the situation and why you believe this punishment should be lifted or reduced."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Upload Supporting Documents</label>
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.docx"
                className="text-white bg-[#1e1e22] border border-gray-700 rounded px-4 py-2 w-full"
                onChange={e => setFiles(e.target.files)}
              />
              <p className="text-sm text-gray-500 mt-1">Accepted: PNG, JPG, DOCX</p>

              {files && (
                <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
                  {Array.from(files).map((file, idx) => <li key={idx}>{file.name}</li>)}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-500 transition disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting..." : "Submit Appeal"}
            </button>
          </form>
        </div>
      )}
    </PageLayout>
  );
};

export default AppealFormPage;
