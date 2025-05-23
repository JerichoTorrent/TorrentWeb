import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Thread } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AuthContext from "../../context/AuthContext";

interface ThreadsListProps {
  threads?: Thread[];
  categorySlug?: string;
  disableStickies?: boolean;
}

const ThreadsList = ({ threads: externalThreads, categorySlug, disableStickies = false }: ThreadsListProps) => {
  const [threads, setThreads] = useState<Thread[]>(externalThreads || []);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const navigate = useNavigate();

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const url = categorySlug
        ? `/api/forums/threads?category=${categorySlug}&page=${page}&limit=${limit}`
        : `/api/forums/threads?page=${page}&limit=${limit}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      };

      const res = await fetch(url, { headers });
      const data = await res.json();

      const visibleThreads = (data.threads || []).filter((thread: Thread) => {
        if (!thread.is_private) return true;
        if (!user) return false;
        return user.uuid === thread.user_id || user.is_staff;
      });

      const sortedThreads = disableStickies
        ? visibleThreads.sort(
          (a: Thread, b: Thread) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        : visibleThreads;

      setThreads(sortedThreads);
      setTotal(visibleThreads.length);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!externalThreads || externalThreads.length === 0) {
      fetchThreads();
    } else {
      // You must explicitly stop loading when using external threads
      setThreads(externalThreads);
      setTotal(externalThreads.length);
      setLoading(false);
    }
  }, [externalThreads, page, categorySlug]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="text-right mb-6">
        <button
          onClick={() =>
            navigate(
              categorySlug
                ? `/forums/new-thread?category=${encodeURIComponent(categorySlug)}`
                : "/forums/new-thread"
            )
          }
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
            {threads.map((thread) => {
              const isSticky = !disableStickies && thread.is_sticky;
              

              const formattedContent =
                (thread.content || "")
                  .split("\n")
                  .map((line: string) => line.trimEnd())
                  .join("  \n")
                  .slice(0, 400) + "...";

              return (
                <div
                  key={thread.id}
                  className={`cursor-pointer rounded-lg p-6 hover:border-purple-500 transition border ${isSticky ? "bg-gray-900 border-gray-600" : "bg-[#1e1e22] border-gray-700"
                    }`}
                  onClick={() =>
                    navigate(`/forums/category/${thread.category_slug}/thread/${thread.id}`, {
                      state: { threadTitle: thread.title },
                    })
                  }
                >
                  <h2 className="text-xl font-semibold text-purple-300">
                    {isSticky ? (
                      <>
                        <span className="mr-1">📌</span>
                        {thread.title}
                      </>
                    ) : (
                      thread.title
                    )}
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">
                    by <span className="text-white">{thread.username}</span> ·{" "}
                    {new Date(thread.created_at).toLocaleString()}
                  </p>
                  <div className="text-gray-300 text-sm mt-3 prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formattedContent}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <span>
                      {(thread.reputation ?? 0) > 0
                        ? `+${thread.reputation ?? 0}`
                        : thread.reputation ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
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
    </>
  );
};

export default ThreadsList;
