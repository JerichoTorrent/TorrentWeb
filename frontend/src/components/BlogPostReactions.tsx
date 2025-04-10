import { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";

const emojiOptions = ["🔥", "👍", "❤️", "😮", "😂", "😡"];

type BlogPostReactionsProps = {
  slug: string;
  initialReactions: Record<string, number>;
};

const BlogPostReactions = ({ slug, initialReactions }: BlogPostReactionsProps) => {
  const { user } = useContext(AuthContext);
  const [reactions, setReactions] = useState(initialReactions || {});
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmojiClick = async (emoji: string) => {
    if (!user) {
      alert("Login required to react.");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/blog/${slug}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      const data = await res.json();
      if (res.ok) {
        setReactions(data.reactions);
        setSelectedEmoji(emoji);
      } else {
        alert(data.error || "Failed to react.");
      }
    } catch (err) {
      console.error("Reaction error:", err);
      alert("Error reacting to post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {emojiOptions.map((emoji) => (
        <button
          key={emoji}
          className={`flex items-center px-3 py-1 rounded-full border transition
            ${selectedEmoji === emoji ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}
          `}
          onClick={() => handleEmojiClick(emoji)}
        >
          <span className="mr-2 text-lg">{emoji}</span>
          <span className="text-sm">{reactions[emoji] || 0}</span>
        </button>
      ))}
    </div>
  );
};

export default BlogPostReactions;
