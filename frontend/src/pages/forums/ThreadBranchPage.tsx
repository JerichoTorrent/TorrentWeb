import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import ThreadPost from "../../components/forums/ThreadPost";
import ReplyTree from "../../components/forums/ReplyTree";
import AuthContext from "../../context/AuthContext";
import { Thread, Reply } from "../../types";

const ThreadBranchPage = () => {
  const { id, parentId } = useParams<{ id: string; parentId: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [thread, setThread] = useState<Thread | null>(null);
  const [parentReply, setParentReply] = useState<Reply | null>(null);
  const [childReplies, setChildReplies] = useState<Reply[]>([]);
  const [localReplies, setLocalReplies] = useState<Reply[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const threadRes = await fetch(`/api/forums/threads/${id}`);
      if (!threadRes.ok) throw new Error("Thread not found");
      const threadData = await threadRes.json();

      const repliesRes = await fetch(`/api/forums/threads/${id}/replies/${parentId}`);
      if (!repliesRes.ok) throw new Error("Replies not found");
      const repliesData = await repliesRes.json();

      setThread(threadData.thread);
      setParentReply(repliesData.parent);
      setChildReplies(repliesData.replies || []);
      setLocalReplies([]);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !parentId) return;
    fetchData();
  }, [id, parentId]);

  const handleReply = (id: number) => {
    setReplyingTo(id);
    setReplyInputs((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmitReply = async (replyToId: number) => {
    const content = replyInputs[replyToId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(`/api/forums/threads/${id}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ content, parent_id: replyToId }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setLocalReplies((prev) => [data.reply, ...prev]);
      } else {
        alert(data.error || "Failed to post reply.");
      }

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
        Authorization: `Bearer ${user?.token}`,
      },
      body: JSON.stringify({ content: newContent }),
    });

    if (res.ok) {
      fetchData();
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
      fetchData();
    } else {
      alert("Failed to delete reply.");
    }
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-3xl mx-auto py-16 px-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading branch...</p>
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
            <ThreadPost thread={thread} />

            <div className="mb-10">
              <ReplyTree
                replies={
                  localReplies.length > 0
                    ? [parentReply, ...localReplies, ...childReplies]
                    : [parentReply, ...childReplies]
                }
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
              />
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate(`/forums/threads/${id}`)}
                className="text-sm text-blue-400 hover:underline"
              >
                ← See all replies
              </button>
            </div>
          </>
        ) : null}
      </div>
    </PageLayout>
  );
};

export default ThreadBranchPage;
