import BlogComment from "./BlogComment";
import { CommentType } from "../types";

type BlogCommentTreeProps = {
  comments: CommentType[];
  parentId?: number | null;
  depth?: number;
  onReply: (parentId: number) => void;
  onSubmitReply: (parentId: number) => void;
  onCancelReply: (parentId: number) => void;
  replyInputs: Record<number, string>;
  setReplyInput: (parentId: number, value: string) => void;
  onEdit: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  replyingTo: number | null;
};

const BlogCommentTree = ({
  comments,
  parentId = null,
  depth = 0,
  onReply,
  onSubmitReply,
  onCancelReply,
  replyInputs,
  setReplyInput,
  onEdit,
  onDelete,
  editingId,
  setEditingId,
  replyingTo,
}: BlogCommentTreeProps) => {
  const children = comments.filter((c) => c.parent_id === parentId);

  return (
    <>
      {children.map((comment) => {
        const nextDepth = depth + 1;
        const nested = comments.filter((c) => c.parent_id === comment.id);
        const tooDeep = nextDepth >= 3;

        return (
          <div key={comment.id}>
            <BlogComment
              comment={comment}
              depth={depth}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              replyInput={replyInputs[comment.id] || ""}
              setReplyInput={setReplyInput}
              onEdit={onEdit}
              onDelete={onDelete}
              isReplying={replyingTo === comment.id}
              isEditing={editingId === comment.id}
              setEditingId={setEditingId}
            />

            {/* Inline replies (if not too deep) */}
            {!tooDeep &&
              nested.map((child) => (
                <BlogCommentTree
                  key={child.id}
                  comments={comments}
                  parentId={child.parent_id}
                  depth={nextDepth}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  replyInputs={replyInputs}
                  setReplyInput={setReplyInput}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  replyingTo={replyingTo}
                />
              ))}

            {/* Flatten all remaining replies inline if cap is hit */}
            {tooDeep &&
              nested.length > 0 &&
              nested.map((child) => (
                <BlogComment
                  key={child.id}
                  comment={child}
                  depth={3} // fixed depth for inline replies
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  replyInput={replyInputs[child.id] || ""}
                  setReplyInput={setReplyInput}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReplying={replyingTo === child.id}
                  isEditing={editingId === child.id}
                  setEditingId={setEditingId}
                />
              ))}
          </div>
        );
      })}
    </>
  );
};

export default BlogCommentTree;
