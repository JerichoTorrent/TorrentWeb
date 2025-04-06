import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import AuthContext from "../../context/AuthContext";
import ReplyTree from "../../components/forums/ReplyTree";
import ThreadPost from "../../components/forums/ThreadPost";
import { Thread as ThreadType, Reply as ReplyType } from "../../types";
import ForumSearchBar from "../../components/forums/ForumSearchBar";
import { MentionsInput, Mention } from "react-mentions";
import mentionStyle from "../../styles/mentionStyle";
import debounce from "lodash.debounce";

const ThreadPage = () => {
  const { id, categorySlug } = useParams<{ id: string; categorySlug: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [thread, setThread] = useState<ThreadType | null>(null);
  const [reputation, setReputation] = useState(0);
  const [replies, setReplies] = useState<ReplyType[]>([]);
  const [localTopReplies, setLocalTopReplies] = useState<ReplyType[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; display: string }[]>([]);

  const [page, setPage] = useState(1);
  const [totalReplies, setTotalReplies] = useState(0);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const threadRes = await fetch(`/api/forums/threads/${id}`);
        if (!threadRes.ok) throw new Error("Thread not found");
        const threadData = await threadRes.json();

        const repliesRes = await fetch(`/api/forums/threads/${id}/replies?page=${page}&limit=${limit}`);
        const repliesData = await repliesRes.json();

        const repRes = await fetch(`/api/forums/posts/${threadData.thread.id}/reputation`);
        if (repRes.ok) {
          const repData = await repRes.json();
          setReputation(repData.reputation);
        }

        setThread(threadData.thread);
        setReplies(
          (repliesData.replies || []).map((r: ReplyType) => ({
            ...r,
            children: r.children || [],
          }))
        );
        setTotalReplies(repliesData.total || 0);
        if (page === 1) {
          setLocalTopReplies([]);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, page]);

  const handleSubmit = async (parentId: number | null = null) => {
    const inputKey = parentId ?? "root";
    if (!id || !replyInputs[inputKey]?.trim()) return;

    try {
      const res = await fetch(`/api/forums/threads/${id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          content: replyInputs[inputKey],
          parent_id: parentId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        if (parentId === null) {
          setLocalTopReplies((prev) => [data.reply, ...prev]);
          setTotalReplies((prev) => prev + 1);
        } else {
          setReplies((prev) => {
            const insertNested = (replies: ReplyType[]): ReplyType[] => {
              let found = false;
          
              const mapped = replies.map((r) => {
                if (r.id === parentId) {
                  found = true;
                  return {
                    ...r,
                    children: r.children ? [...r.children, data.reply] : [data.reply],
                  };
                } else if (r.children) {
                  const updatedChildren = insertNested(r.children);
                  return { ...r, children: updatedChildren };
                } else {
                  return r;
                }
              });
          
              // if not found in current tree, add to top (temp fix)
              if (!found && parentId) {
                mapped.push({
                  ...data.reply,
                  children: [],
                });
              }
          
              return mapped;
            };
          
            return insertNested(prev);
          });
        }

        setReplyInputs((prev) => {
          const copy = { ...prev };
          delete copy[inputKey];
          return copy;
        });

        setReplyingTo(null);
      } else {
        alert(data.error || "Failed to post reply.");
      }
    } catch {
      alert("Failed to post reply.");
    }
  };

  const handleEdit = async (replyId: number, newContent: string) => {
    const res = await fetch(`/api/forums/replies/${replyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (res.ok) {
      const updateReplies = (list: ReplyType[]): ReplyType[] =>
        list.map((r) =>
          r.id === replyId
            ? { ...r, content: newContent }
            : {
                ...r,
                children: r.children ? updateReplies(r.children) : r.children,
              }
        );

      setReplies((prev) => updateReplies(prev));
      setLocalTopReplies((prev) => updateReplies(prev));
      setEditingReplyId(null);
    } else {
      alert("Failed to update reply.");
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/suggest?q=${query}`);
      const users = await res.json();
      if (Array.isArray(users)) {
        const cleaned = users.filter(
          (u) => u && typeof u === "object" && u.id && u.display
        );
        setSuggestions(cleaned);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("❌ Mention fetch failed:", err);
      setSuggestions([]);
    }
  };  

  const loadSuggestionsDebounced = useCallback(
    debounce((query: string) => {
      loadSuggestions(query);
    }, 300),
    []
  );  
  const handleDelete = async (replyId: number) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    const res = await fetch(`/api/forums/replies/${replyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user?.token}` },
    });

    if (res.ok) {
      const removeReply = (list: ReplyType[]): ReplyType[] =>
        list
          .filter((r: ReplyType) => r.id !== replyId)
          .map((r: ReplyType) => ({
            ...r,
            children: r.children ? removeReply(r.children) : [],
          }));

      setReplies((prev) => removeReply(prev));
      setLocalTopReplies((prev) => removeReply(prev));
      setTotalReplies((prev) => prev - 1);
    } else {
      alert("Failed to delete reply.");
    }
  };

  const handleDeleteThread = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this thread?")) return;

    const res = await fetch(`/api/forums/threads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user?.token}` },
    });

    if (res.ok) {
      navigate(`/forums/category/${categorySlug}`);
    } else {
      alert("Failed to delete thread.");
    }
  };

  return (
    <PageLayout fullWidth>
      <div className="w-full overflow-x-auto py-16 px-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading thread...</p>
        ) : error ? (
          <div className="text-center text-red-400">
            <p>❌ {error}</p>
            <button
              onClick={() => navigate(`/forums/category/${categorySlug}`)}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500 transition"
            >
              Back to Forums
            </button>
          </div>
        ) : thread ? (
          <>
            <ForumSearchBar categorySlug={categorySlug} />
            <ThreadPost
              thread={thread}
              currentUserId={user?.uuid}
              onDeleteThread={handleDeleteThread}
              onReply={() => {}}
            />

            {user && (
              <div className="w-full mb-6">
                <MentionsInput
                  value={replyInputs["root"] || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReplyInputs((prev) => ({ ...prev, root: value }));

                    const lastWord = value.split(/\s+/).pop() || "";
                    if (lastWord.startsWith("@") && lastWord.length > 1) {
                      loadSuggestionsDebounced(lastWord.slice(1));
                    }
                  }}
                  style={mentionStyle}
                  placeholder="Write your reply..."
                  allowSuggestionsAboveCursor
                >
                  <Mention
                    trigger="@"
                    data={suggestions}
                    appendSpaceOnAdd
                  />
                </MentionsInput>

                <button
                  onClick={() => handleSubmit(null)}
                  className="mt-3 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-500 transition"
                >
                  Post Reply
                </button>
              </div>
            )}

            <ReplyTree
              replies={[...localTopReplies, ...replies]}
              parentId={null}
              depth={0}
              replyInputs={replyInputs}
              setReplyInput={(id, val) => setReplyInputs((prev) => ({ ...prev, [id]: val }))}
              onSubmitReply={handleSubmit}
              onCancelReply={(id) => {
                setReplyingTo(null);
                setReplyInputs((prev) => {
                  const copy = { ...prev };
                  delete copy[id];
                  return copy;
                });
              }}
              onReply={(id) => {
                setReplyingTo(id);
                setReplyInputs((prev) => ({ ...prev, [id]: prev[id] ?? "" }));
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingReplyId={editingReplyId}
              setEditingReplyId={setEditingReplyId}
              replyingTo={replyingTo}
              threadId={thread.id}
            />

            {totalReplies > limit && (
              <div className="flex justify-center gap-4 mb-10">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-gray-400 pt-2">
                  Page {page} of {Math.ceil(totalReplies / limit)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(totalReplies / limit)))}
                  disabled={page === Math.ceil(totalReplies / limit)}
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {!user && (
              <p className="text-center text-gray-500">
                ⚠ You must be logged in to reply to this thread.
              </p>
            )}
          </>
        ) : null}
      </div>
    </PageLayout>
  );
};

export default ThreadPage;