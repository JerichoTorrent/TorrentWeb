import { useEffect, useState } from "react";
import Reply from "./Reply";
import { Reply as ReplyType } from "../../types";

type Props = {
  replies: ReplyType[];
  parentId?: number | null;
  depth?: number;
  onReply: (parentId: number) => void;
  onSubmitReply: (parentId: number) => void;
  onCancelReply: (parentId: number) => void;
  replyInputs: Record<string, string>;
  setReplyInput: (parentId: number, value: string) => void;
  onEdit: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
  editingReplyId: number | null;
  setEditingReplyId: (id: number | null) => void;
  replyingTo: number | null;
  threadId: number;
};

const ReplyTree = ({
  replies,
  parentId = null,
  depth = 0,
  onReply,
  onSubmitReply,
  onCancelReply,
  replyInputs,
  setReplyInput,
  onEdit,
  onDelete,
  editingReplyId,
  setEditingReplyId,
  replyingTo,
  threadId,
}: Props) => {
  const [maxDepth, setMaxDepth] = useState(10);

  useEffect(() => {
    const updateDepthLimit = () => {
      setMaxDepth(window.innerWidth < 768 ? 5 : 10);
    };
    updateDepthLimit();
    window.addEventListener("resize", updateDepthLimit);
    return () => window.removeEventListener("resize", updateDepthLimit);
  }, []);

  const childReplies = replies.filter((r) => r.parent_id === parentId);

  return (
    <>
      {childReplies.map((reply) => {
        const children = reply.children ?? [];
        const showMore = children.length > maxDepth;
        const visibleChildren = children.slice(0, maxDepth);

        return (
          <div key={reply.id}>
            <Reply
              reply={reply}
              depth={depth}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              replyInput={replyInputs[reply.id] || ""}
              setReplyInput={setReplyInput}
              onEdit={onEdit}
              onDelete={onDelete}
              isReplying={replyingTo === reply.id}
              isEditing={editingReplyId === reply.id}
              setEditingId={setEditingReplyId}
            />

            {depth < maxDepth &&
              visibleChildren.map((child) => (
                <ReplyTree
                  key={child.id}
                  replies={[child]}
                  parentId={child.parent_id}
                  depth={depth + 1}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  replyInputs={replyInputs}
                  setReplyInput={setReplyInput}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editingReplyId={editingReplyId}
                  setEditingReplyId={setEditingReplyId}
                  replyingTo={replyingTo}
                  threadId={threadId}
                />
              ))}

            {showMore && (
              <div className="ml-4 mt-2">
                <a
                  href={`/forums/threads/${threadId}/replies/${reply.id}`}
                  className="text-sm text-purple-400 hover:underline"
                >
                  View {children.length - maxDepth} more replies
                </a>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ReplyTree;
