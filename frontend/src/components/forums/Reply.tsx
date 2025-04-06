import { useState, useEffect, useRef, useContext } from "react";
import { Reply as ReplyType } from "../../types";
import AuthContext from "../../context/AuthContext";
import { MentionsInput, Mention } from "react-mentions";
import mentionStyle from "../../styles/mentionStyle";
import debounce from "lodash.debounce";

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
  const [reputation, setReputation] = useState(0);
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; display: string }[]>([]);

  useEffect(() => {
    const checkWidth = () => {
      setMaxDepth(window.innerWidth < 768 ? 5 : 10);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    if (isReplying && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReplying]);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const res = await fetch(`/api/forums/posts/${reply.id}/reputation`);
        const data = await res.json();
        if (res.ok) setReputation(data.reputation);
      } catch {
        console.error("Failed to fetch reply reputation.");
      }
    };
    fetchReputation();
  }, [reply.id]);

  const handleReaction = async (type: "upvote" | "downvote") => {
    if (!user) return alert("Login required.");
    try {
      const res = await fetch(`/api/forums/posts/${reply.id}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ reaction: type }),
      });
      const data = await res.json();
      if (res.ok) {
        setReputation(data.reputation);
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
      const res = await fetch(`/api/forums/posts/${reply.id}/flag`, {
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

  const loadSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/users/suggest?q=${query}`);
      const users = await res.json();
      if (Array.isArray(users)) {
        const cleaned = users.filter((u) => u && typeof u === "object" && u.id && u.display);
        setSuggestions(cleaned);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Mention fetch failed:", err);
      setSuggestions([]);
    }
  };
  
  const loadSuggestionsDebounced = debounce((query: string) => {
    loadSuggestions(query);
  }, 300);

  const effectiveDepth = Math.min(depth, maxDepth);
  const marginLeft = `${effectiveDepth * 12}px`;

  return (
    <div className="mb-3 relative" style={{ marginLeft }}>
      <div className="border-l border-gray-600 pl-4">
        <p className="text-sm text-gray-400 mb-1">
          {reply.deleted ? (
            <span className="italic text-gray-500">[Deleted content]</span>
          ) : (
            <>
              <a
                href={`/dashboard/${reply.username}`}
                className="text-white hover:underline hover:text-purple-400 transition"
              >
                {reply.username}
              </a>{" "}
              · {new Date(reply.created_at).toLocaleString()}
              {!!reply.edited && <span className="ml-2 italic text-gray-500">(edited)</span>}
            </>
          )}
        </p>

        {!reply.deleted && (
          <>
            {isEditing ? (
              <>
                <MentionsInput
                  value={replyInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReplyInput(reply.id, value);

                    const lastWord = value.split(/\s+/).pop() || "";
                    if (lastWord.startsWith("@") && lastWord.length > 1) {
                      loadSuggestionsDebounced(lastWord.slice(1));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const enterEvent = new KeyboardEvent("keydown", {
                        key: "Enter",
                        code: "Enter",
                        bubbles: true,
                        cancelable: true,
                      });
                      e.currentTarget.dispatchEvent(enterEvent);
                    }
                  }}
                  style={mentionStyle}
                  placeholder="Write your reply..."
                  allowSuggestionsAboveCursor
                  className="mb-2"
                >
                  <Mention
                    trigger="@"
                    data={suggestions}
                    appendSpaceOnAdd
                  />
                </MentionsInput>


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
              <div
                className="text-gray-300 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: reply.content_html || reply.content }}
              />
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
              {user && !isEditing && (
                <button onClick={() => onReply(reply.id)} className="text-blue-400 hover:underline">
                  Reply
                </button>
              )}
              {(user?.uuid === reply.user_id || user?.is_staff) && !isEditing && (
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
                  <button onClick={() => onDelete(reply.id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => handleReaction("upvote")} className="text-green-400 hover:underline">
                  ▲
                </button>
                <span className="text-gray-400">{reputation}</span>
                <button onClick={() => handleReaction("downvote")} className="text-red-400 hover:underline">
                  ▼
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFlagMenu((prev) => !prev)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Reply;
