import { useState, useEffect, useRef, useContext } from "react";
import { Reply as ReplyType } from "../../types";
import AuthContext from "../../context/AuthContext";

type ReplyProps = {
  reply: ReplyType;
  depth: number;
  onReply: (parentId: number) => void;
  onSubmitReply: (parentId: number) => void;
  onCancelReply: (parentId: number) => void;
  replyInput: string;
  setReplyInput: (parentId: number, value: string) => void;
  onEdit: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
  isReplying: boolean;
  isEditing: boolean;
  setEditingId: (id: number | null) => void;
};

const Reply = ({
  reply,
  depth,
  onReply,
  onSubmitReply,
  onCancelReply,
  replyInput,
  setReplyInput,
  onEdit,
  onDelete,
  isReplying,
  isEditing,
  setEditingId,
}: ReplyProps) => {
  const { user } = useContext(AuthContext);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [maxDepth, setMaxDepth] = useState(10);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      setMaxDepth(window.innerWidth < 768 ? 5 : 10);
    };

    checkWidth(); // Initial check
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    if (isReplying && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReplying]);

  const effectiveDepth = Math.min(depth, maxDepth);
  const marginLeft = `${effectiveDepth * 12}px`;

  return (
    <div className="mb-3 relative" style={{ marginLeft }}>
      <div className="border-l border-gray-600 pl-4">
        <p className="text-sm text-gray-400 mb-1">
        <a
          href={`/dashboard/${reply.username}`}
          className="text-white hover:underline hover:text-purple-400 transition"
        >
          {reply.username}
        </a> ·{" "}
          {new Date(reply.created_at).toLocaleString()}
        </p>

        {isEditing ? (
          <>
            <textarea
              className="w-full bg-[#121217] text-white border border-gray-700 rounded p-2 text-sm"
              rows={4}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  onEdit(reply.id, editedContent);
                  setEditingId(null);
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-500 transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap">{reply.content}</p>
        )}

        <div className="flex gap-4 text-sm mt-2">
          {user && !isEditing && (
            <button onClick={() => onReply(reply.id)} className="text-blue-400 hover:underline">
              Reply
            </button>
          )}
          {user?.uuid === reply.user_id && !isEditing && (
            <>
              <button
                onClick={() => {
                  setEditingId(reply.id);
                  setEditedContent(reply.content);
                }}
                className="text-yellow-400 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(reply.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="mt-3">
            <textarea
              ref={textareaRef}
              rows={4}
              className="w-full bg-[#1e1e22] text-white border border-gray-700 rounded p-2 text-sm mb-2"
              placeholder="Write your reply..."
              value={replyInput}
              onChange={(e) => setReplyInput(reply.id, e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onSubmitReply(reply.id)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
              >
                Post Reply
              </button>
              <button
                onClick={() => onCancelReply(reply.id)}
                className="text-sm text-gray-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reply;
