import { useState, useEffect, useRef, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { MentionsInput, Mention } from "react-mentions";
import mentionStyle from "../styles/mentionStyle";
import debounce from "lodash.debounce";
import { CommentType } from "../types";

type BlogCommentProps = {
    comment: CommentType;
    depth: number;
    onReply: (id: number) => void;
    onSubmitReply: (id: number) => void;
    onCancelReply: (id: number) => void;
    replyInput: string;
    setReplyInput: (id: number, value: string) => void;
    onEdit: (id: number, newContent: string) => void;
    onDelete: (id: number) => void;
    isReplying: boolean;
    isEditing: boolean;
    setEditingId: (id: number | null) => void;
  };

const BlogComment = ({
  comment,
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
}: BlogCommentProps) => {
  const { user } = useContext(AuthContext);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editedContent, setEditedContent] = useState(comment.content);
  const [reputation, setReputation] = useState(0);
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; display: string }[]>([]);

  const effectiveDepth = Math.min(depth, 3);
  const marginLeft = `${effectiveDepth * 24}px`;

  useEffect(() => {
    if (isReplying && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReplying]);

  useEffect(() => {
    // Convert reactions object to net rep score
    const up = comment.reactions?.upvote || 0;
    const down = comment.reactions?.downvote || 0;
    setReputation(up - down);
  }, [comment.reactions]);

  const handleReaction = async (type: "upvote" | "downvote") => {
    if (!user) return alert("Login required.");
    try {
      const res = await fetch(`/api/blog/comments/${comment.id}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        const up = data.reactions?.upvote || 0;
        const down = data.reactions?.downvote || 0;
        setReputation(up - down);
      } else {
        alert(data.error || "Failed to react.");
      }
    } catch {
      alert("Error submitting reaction.");
    }
  };

  const handleFlag = async (reason: string) => {
    if (!user) return alert("Login required.");
    setShowFlagMenu(false);
    try {
      const res = await fetch(`/api/blog/comments/${comment.id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed to flag.");
    } catch {
      alert("Error submitting flag.");
    }
  };

  const loadSuggestions = debounce(async (query: string) => {
    try {
      const res = await fetch(`/api/users/suggest?q=${query}`);
      const users = await res.json();
      if (Array.isArray(users)) {
        const valid = users.filter(u => u.id && u.display);
        setSuggestions(valid);
      }
    } catch {
      setSuggestions([]);
    }
  }, 300);

  return (
    <div className="mb-3 relative" style={{ marginLeft }}>
      <div className="border-l border-gray-600 pl-4">
        <p className="text-sm text-gray-400 mb-1">
          {comment.deleted ? (
            <span className="italic text-gray-500">[Deleted content]</span>
          ) : (
            <>
              <a href={`/dashboard/${comment.username}`} className="text-white hover:underline">
                {comment.username}
              </a>{" "}
              · {new Date(comment.created_at).toLocaleString()}
              {!!comment.edited && (
                <span className="ml-2 italic text-gray-500">(edited)</span>
              )}
            </>
          )}
        </p>

        {!comment.deleted && (
          <>
            {isEditing ? (
              <>
                <MentionsInput
                  value={editedContent}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditedContent(value);
                    const last = value.split(/\s+/).pop() || "";
                    if (last.startsWith("@")) loadSuggestions(last.slice(1));
                  }}
                  style={mentionStyle}
                  placeholder="Edit your comment..."
                  allowSuggestionsAboveCursor
                  className="mb-2"
                >
                  <Mention trigger="@" data={suggestions} appendSpaceOnAdd />
                </MentionsInput>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      onEdit(comment.id, editedContent);
                      setEditingId(null);
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div
                className="text-gray-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: comment.content_html || comment.content }}
              />
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
              {user && !isEditing && (
                <button onClick={() => onReply(comment.id)} className="text-blue-400 hover:underline">
                  Reply
                </button>
              )}
              {(user?.uuid === comment.user_id || user?.is_staff) && !isEditing && (
                <>
                  <button onClick={() => {
                    setEditingId(comment.id);
                    setEditedContent(comment.content);
                  }} className="text-yellow-400 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => onDelete(comment.id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => handleReaction("upvote")} className="text-green-400 hover:underline">▲</button>
                <span className="text-gray-400">{reputation}</span>
                <button onClick={() => handleReaction("downvote")} className="text-red-400 hover:underline">▼</button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFlagMenu(prev => !prev)}
                  className="text-sm text-gray-400 hover:underline"
                >
                  🚩 Flag
                </button>
                {showFlagMenu && (
                  <div className="absolute z-10 mt-1 bg-[#1e1e22] border border-gray-700 rounded shadow text-sm">
                    {[
                      ["inappropriate", "Inappropriate Content"],
                      ["harassment", "Bullying/Harassment"],
                      ["doxxing", "Doxxing"],
                      ["guidelines", "Doesn't follow guidelines"],
                      ["exploits", "Server exploits"],
                      ["other", "Other"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleFlag(key)}
                        className="block px-4 py-2 w-full text-left hover:bg-gray-800 text-white"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isReplying && (
              <div className="mt-3">
                <textarea
                  ref={textareaRef}
                  rows={4}
                  className="w-full bg-[#1e1e22] text-white border border-gray-700 rounded p-2 text-sm mb-2"
                  placeholder="Write your reply..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(comment.id, e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSubmitReply(comment.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => onCancelReply(comment.id)}
                    className="text-sm text-gray-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogComment;
