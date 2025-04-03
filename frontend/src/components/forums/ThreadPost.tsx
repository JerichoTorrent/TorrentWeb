import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Thread } from "../../types";
import AuthContext from "../../context/AuthContext";

type Props = {
  thread: Thread;
  onDeleteThread?: () => void;
  currentUserId?: string;
};

const ThreadPost = ({ thread, onDeleteThread, currentUserId }: Props) => {
  const { user } = useContext(AuthContext);
  const isAuthor = currentUserId === thread.user_id;

  const [reputation, setReputation] = useState(0);
  const [showFlagMenu, setShowFlagMenu] = useState(false);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const res = await fetch(`/api/forums/posts/${thread.id}/reputation`);
        const data = await res.json();
        if (res.ok) setReputation(data.reputation);
      } catch {
        console.error("Failed to fetch reputation.");
      }
    };

    fetchReputation();
  }, [thread.id]);

  const handleReaction = async (type: "upvote" | "downvote") => {
    if (!user) return alert("Login required.");
    try {
      const res = await fetch(`/api/forums/posts/${thread.id}/react`, {
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
      const res = await fetch(`/api/forums/posts/${thread.id}/flag`, {
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

  return (
    <div className="bg-[#1e1e22] text-gray-300 p-6 rounded-lg border border-gray-700 mb-10 relative">
      <h2 className="text-3xl font-bold text-purple-400 mb-4">
        {thread.is_sticky ? (
          <>
            <span className="mr-1">📌</span>
              {thread.title}
          </>
        ) : (
          thread.title
        )}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Posted by{" "}
        <Link to={`/dashboard/${thread.username}`} className="text-purple-400 hover:underline">
          {thread.username}
        </Link>{" "}
        on {new Date(thread.created_at).toLocaleString()}
      </p>

      <div className="whitespace-pre-wrap mb-4">{thread.content}</div>

      <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReaction("upvote")}
            className="text-green-400 hover:underline"
          >
            ▲
          </button>
          <span className="text-gray-400">{reputation}</span>
          <button
            onClick={() => handleReaction("downvote")}
            className="text-red-400 hover:underline"
          >
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
      {user?.is_staff && (
        <button
          onClick={async () => {
            const confirmToggle = confirm(
              thread.is_sticky ? "Unpin this thread?" : "Make this thread sticky?"
            );
            if (!confirmToggle) return;

            try {
              const res = await fetch(`/api/forums/threads/${thread.id}/sticky`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ is_sticky: !thread.is_sticky }),
              });

              if (res.ok) {
                window.location.reload(); // refresh to reflect change
              } else {
                const data = await res.json();
                alert(data.error || "Failed to update sticky status.");
              }
            } catch {
              alert("Error updating sticky status.");
            }
          }}
          className="absolute top-4 left-4 text-sm text-yellow-400 hover:underline"
        >
          {thread.is_sticky ? "📌 Unpin" : "📌 Make Sticky"}
        </button>
      )}
      {isAuthor && onDeleteThread && (
        <button
          onClick={onDeleteThread}
          className="absolute top-4 right-4 text-sm text-red-500 hover:underline"
        >
          Delete Thread
        </button>
      )}
    </div>
  );
};

export default ThreadPost;
