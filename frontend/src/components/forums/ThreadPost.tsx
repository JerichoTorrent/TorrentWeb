import { Link } from "react-router-dom";
import { Thread } from "../../types";

type Props = {
  thread: Thread;
  onDeleteThread?: () => void;
  currentUserId?: string; // UUID of the logged-in user
};

const ThreadPost = ({ thread, onDeleteThread, currentUserId }: Props) => {
  const isAuthor = currentUserId === thread.user_id;

  return (
    <div className="bg-[#1e1e22] text-gray-300 p-6 rounded-lg border border-gray-700 mb-10 relative">
      <h1 className="text-3xl font-bold text-purple-400 mb-4">{thread.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Posted by{" "}
        <Link to={`/dashboard/${thread.username}`} className="text-purple-400 hover:underline">
          {thread.username}
        </Link>{" "}
        on {new Date(thread.created_at).toLocaleString()}
      </p>
      <div className="whitespace-pre-wrap mb-4">{thread.content}</div>

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
