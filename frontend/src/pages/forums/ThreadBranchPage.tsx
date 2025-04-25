import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import ThreadPost from "../../components/forums/ThreadPost";
import ReplyTree from "../../components/forums/ReplyTree";
import AuthContext from "../../context/AuthContext";
import ForumSearchBar from "../../components/forums/ForumSearchBar";
import { MentionsInput, Mention } from "react-mentions";
import mentionStyle from "../../styles/mentionStyle";
import debounce from "lodash.debounce";
import { Thread, Reply } from "../../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ThreadBranchPage = () => {
  const { id, parentId, categorySlug = "" } = useParams<{
    id: string;
    parentId: string;
    categorySlug?: string;
  }>();
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const [thread, setThread] = useState<Thread | null>(null);
  const [parentReply, setParentReply] = useState<Reply | null>(null);
  const [childReplies, setChildReplies] = useState<Reply[]>([]);
  const [localReplies, setLocalReplies] = useState<Reply[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; display: string }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !parentId || loading) return;

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const threadRes = await fetch(`${API_BASE_URL}/api/forums/threads/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
          },
          credentials: "include",
          signal: controller.signal
        });

        if (!threadRes.ok) throw new Error("Thread not found");
        const threadData = await threadRes.json();

        const repliesRes = await fetch(`${API_BASE_URL}/api/forums/threads/${id}/replies/${parentId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
          },
          credentials: "include",
          signal: controller.signal
        });

        if (!repliesRes.ok) throw new Error("Replies not found");
        const repliesData = await repliesRes.json();

        setThread(threadData.thread);
        setParentReply(repliesData.parent);
        setChildReplies(repliesData.replies || []);
        setLocalReplies([]);
        setPageLoading(false);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
          setPageLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [id, parentId, loading]);

  useEffect(() => {
    if (thread?.title) {
      navigate(location.pathname, {
        replace: true,
        state: { threadTitle: thread.title },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.title]);

  const handleReply = (id: number) => {
    setReplyingTo(id);
    setReplyInputs((prev) => ({ ...prev, [id]: prev[id] ?? "" }));
  };

  const handleSubmitReply = async (replyToId: number) => {
    const content = replyInputs[replyToId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(`/api/forums/threads/${id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify({ content, parent_id: replyToId }),
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Failed to post reply.");
      }

      const { reply: posted } = await res.json();
      const fullRes = await fetch(`/api/forums/replies/${posted.id}`);
      const { reply } = await fullRes.json();

      setChildReplies((prev) => {
        const insertNested = (list: Reply[]): Reply[] =>
          list.map((r) =>
            r.id === replyToId
              ? {
                ...r,
                children: r.children ? [...r.children, reply] : [reply],
              }
              : {
                ...r,
                children: r.children ? insertNested(r.children) : [],
              }
          );

        return insertNested(prev);
      });

      setReplyInputs((prev) => {
        const copy = { ...prev };
        delete copy[replyToId];
        return copy;
      });
      setReplyingTo(null);
    } catch {
      alert("Failed to post reply.");
    }
  };

  const handleCancelReply = (id: number) => {
    setReplyingTo(null);
    setReplyInputs((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleEdit = async (id: number, newContent: string) => {
    const res = await fetch(`/api/forums/replies/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (res.ok) {
      const fullRes = await fetch(`/api/forums/replies/${id}`);
      const { reply } = await fullRes.json();

      setChildReplies((prev) => {
        const update = (list: Reply[]): Reply[] =>
          list.map((r) =>
            r.id === id
              ? reply
              : {
                ...r,
                children: r.children ? update(r.children) : [],
              }
          );
        return update(prev);
      });
    } else {
      alert("Failed to update reply.");
    }

    setEditingReplyId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    const res = await fetch(`/api/forums/replies/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    });

    if (res.ok) {
      setChildReplies((prev) =>
        prev.filter((r) => r.id !== id)
      );
    } else {
      alert("Failed to delete reply.");
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/suggest?q=${query}`);
      const users = await res.json();
      setSuggestions(Array.isArray(users) ? users : []);
    } catch {
      setSuggestions([]);
    }
  };

  const loadSuggestionsDebounced = useCallback(
    debounce((query: string) => {
      loadSuggestions(query);
    }, 300),
    []
  );

  return (
    <PageLayout fullWidth>
      <div className="w-full overflow-x-auto py-16 px-4">
        {pageLoading ? (
          <p className="text-center text-gray-400">Loading thread branch...</p>
        ) : error ? (
          <div className="text-center text-red-400">
            <p>❌ {error}</p>
            <button
              onClick={() => navigate("/forums")}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
            >
              Back to Forums
            </button>
          </div>
        ) : thread && parentReply ? (
          <>

            <ForumSearchBar categorySlug={thread.category_slug} />

            <ThreadPost
              thread={thread}
              currentUserId={user?.uuid}
              onDeleteThread={() => navigate(`/forums/category/${thread.category_slug}`)}
              onReply={() => { }}
            />

            {user && (
              <div className="w-full mb-6">
                <MentionsInput
                  key={parentReply.id}
                  value={replyInputs[parentReply.id] || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReplyInputs((prev) => ({ ...prev, [parentReply.id]: value }));

                    const lastWord = value.split(/\s+/).pop() || "";
                    if (lastWord.startsWith("@") && lastWord.length > 1) {
                      loadSuggestionsDebounced(lastWord.slice(1));
                    }
                  }}
                  style={mentionStyle}
                  placeholder="Write your reply..."
                  allowSuggestionsAboveCursor
                >
                  <Mention trigger="@" data={suggestions} appendSpaceOnAdd />
                </MentionsInput>

                <button
                  onClick={() => handleSubmitReply(parentReply.id)}
                  className="mt-3 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-500 transition"
                >
                  Post Reply
                </button>
              </div>
            )}

            <ReplyTree
              replies={[parentReply, ...childReplies]}
              parentId={parentReply.id}
              depth={0}
              onReply={handleReply}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
              replyInputs={replyInputs}
              setReplyInput={(id, value) =>
                setReplyInputs((prev) => ({ ...prev, [id]: value }))
              }
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingReplyId={editingReplyId}
              setEditingReplyId={setEditingReplyId}
              replyingTo={replyingTo}
              threadId={Number(id)}
              categorySlug={categorySlug}
              threadTitle={thread.title}
            />

            <div className="text-center mt-6">
              <Link
                to={`/forums/category/${thread.category_slug}/thread/${thread.id}`}
                className="text-sm text-blue-400 hover:underline"
              >
                ← Go back to full thread
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
};

export default ThreadBranchPage;