import { useContext } from "react";
import { useState, useEffect } from "react";
import PageLayout from "../../components/PageLayout";
import ThreadsList from "../../components/forums/ThreadsList";
import AuthContext from "../../context/AuthContext";

const NewsFeedPage = () => {
    const { user } = useContext(AuthContext);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchThreads = async () => {
        setLoading(true);
        try {
            const token = user?.token;
            if (!token) return;

            const res = await fetch(
                `/api/users/${user.uuid}/following-threads?page=${page}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await res.json();
            setThreads(data.threads || []);
            setTotal(data.total || 0);
        } catch (err) {
            setThreads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uuid) fetchThreads();
    }, [user?.uuid, page]);

    return (
        <PageLayout fullWidth>
            <div className="max-w-5xl mx-auto py-16 px-4">
                <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center">News Feed</h1>

                {loading ? (
                    <p className="text-center text-gray-400">Loading threads...</p>
                ) : threads.length === 0 ? (
                    <p className="text-center text-gray-500">
                        You're not following anyone yet or they haven't posted.
                    </p>
                ) : (
                    <ThreadsList threads={threads} disableStickies />
                )}

                {total > limit && (
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-gray-400 pt-2">
                            Page {page} of {Math.ceil(total / limit)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(total / limit)))}
                            disabled={page >= Math.ceil(total / limit)}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </PageLayout>
    );
};

export default NewsFeedPage;
