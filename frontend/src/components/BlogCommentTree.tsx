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

const MAX_NEST_DEPTH = 3;

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
  const flattenReplies = (parentId: number): CommentType[] => {
    const result: CommentType[] = [];
    const queue = comments.filter((c) => c.parent_id === parentId);
  
    while (queue.length > 0) {
      const current = queue.shift();
      if (current) {
        result.push(current);
        const children = comments.filter((c) => c.parent_id === current.id);
        queue.push(...children);
      }
    }
  
    return result;
  };

  return (
    <>
      {children.map((comment) => {
        const nextDepth = depth + 1;
        const cappedDepth = Math.min(depth, MAX_NEST_DEPTH);
        const nested = comments.filter((c) => c.parent_id === comment.id);
        const shouldFlatten = depth >= MAX_NEST_DEPTH;

        return (
          <div key={comment.id}>
            {/* Main comment */}
            <BlogComment
              comment={comment}
              depth={cappedDepth}
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

            {/* Either recurse (if not too deep) or flatten children */}
            {!shouldFlatten ? (
              <BlogCommentTree
                comments={comments}
                parentId={comment.id}
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
            ) : (
              flattenReplies(comment.id).map((flatChild) => (
                <BlogComment
                  key={flatChild.id}
                  comment={flatChild}
                  depth={MAX_NEST_DEPTH}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  replyInput={replyInputs[flatChild.id] || ""}
                  setReplyInput={setReplyInput}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReplying={replyingTo === flatChild.id}
                  isEditing={editingId === flatChild.id}
                  setEditingId={setEditingId}
                />
              ))
            )}
          </div>
        );
      })}
    </>
  );
};

export default BlogCommentTree;
