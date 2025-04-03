import { useState, FormEvent, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import PageLayout from "../../components/PageLayout";

const NewThreadPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/forums/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setTimeout(() => navigate(`/forums/thread/${data.threadId}`), 1000);
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setError("Failed to submit thread.");
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center text-gray-400 py-20">
          <p>⚠ You must be logged in to post a thread.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-purple-400 mb-6">New Thread</h1>

        {status === "success" && (
          <div className="bg-green-700 text-green-100 text-sm px-4 py-3 rounded mb-6">
            ✅ Thread submitted! Redirecting...
          </div>
        )}

        {status === "error" && error && (
          <div className="bg-red-700 text-red-100 text-sm px-4 py-3 rounded mb-6">
            ❌ {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
              placeholder="Enter a descriptive title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
              placeholder="Write your post here..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-500 transition disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Post Thread"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default NewThreadPage;
