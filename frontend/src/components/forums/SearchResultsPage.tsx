import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import ThreadsList from "../../components/forums/ThreadsList";
import { Thread } from "../../types";

const highlight = (text: string, query: string) => {
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-300 text-black px-1 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<Thread[]>([]);
  const [userResults, setUserResults] = useState<{ username: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const query = new URLSearchParams(location.search).get("q") || "";

  useEffect(() => {
    setPage(1); // Reset page when query changes
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchResults = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/forums/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
          signal,
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`Failed with status ${res.status}`);

        const data = await res.json();
        console.log("Search data:", data);
        setResults(data.threads || []);
        setUserResults(data.users || []);
        setTotal(data.total || 0);
        setLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Aborted fetch — silently ignore
          return;
        }
      
        console.error("Search failed:", err);
        setResults([]);
        setUserResults([]);
        setTotal(0);
        setLoading(false);
      }
    };

    if (query.trim()) {
      fetchResults();
    } else {
      setResults([]);
      setUserResults([]);
      setTotal(0);
      setLoading(false);
    }

    return () => controller.abort();
  }, [query, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <PageLayout>
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl text-purple-400 font-bold mb-6">
          Search Results for: <span className="text-white">"{query}"</span>
        </h1>

        {loading ? (
          <p className="text-gray-400">Searching...</p>
        ) : (
          <>
            {userResults.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl text-purple-300 font-semibold mb-2">Users</h2>
                <div className="space-y-2">
                  {userResults.map((user, idx) => (
                    <div
                      key={idx}
                      className="text-purple-400 hover:underline cursor-pointer"
                      onClick={() => navigate(`/dashboard/${user.username}`)}
                    >
                      @{highlight(user.username, query)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 ? (
              <>
                <ThreadsList threads={results} disableStickies />
                {totalPages > 1 && (
                  <div className="flex justify-center gap-4 mt-8">
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
            ) : (
              <p className="text-gray-500">No threads found matching your search.</p>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default SearchResultsPage;
