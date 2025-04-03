import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";

type Thread = {
  id: number;
  title: string;
  content: string;
  username: string;
  created_at: string;
};

const IndexPage = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const navigate = useNavigate();

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forums/threads?page=${page}&limit=${limit}`);
      const data = await res.json();
      setThreads(data.threads || []);
      setTotal(data.total || 0);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">Forum Threads</h1>

        <div className="text-right mb-6">
          <button
            onClick={() => navigate("/forums/new-thread")}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
          >
            + New Thread
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading threads...</p>
        ) : threads.length === 0 ? (
          <p className="text-center text-gray-500">No threads yet. Be the first to post!</p>
        ) : (
          <>
            <div className="space-y-6 mb-10">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => navigate(`/forums/thread/${thread.id}`)}
                  className="cursor-pointer border border-gray-700 bg-[#1e1e22] rounded-lg p-6 hover:border-purple-500 transition"
                >
                  <h2 className="text-xl font-semibold text-purple-300">{thread.title}</h2>
                  <p className="text-gray-400 text-sm mt-2">
                    by <span className="text-white">{thread.username}</span> ·{" "}
                    {new Date(thread.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-300 text-sm mt-3 line-clamp-3">{thread.content}</p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-gray-400 pt-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default IndexPage;
