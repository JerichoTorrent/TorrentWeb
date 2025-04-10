import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import BlogPostReactions from "../components/BlogPostReactions";
import BlogCommentTree from "../components/BlogCommentTree";
import AuthContext from "../context/AuthContext";

interface TocItem {
  text: string;
  level: number;
  id: string;
}

interface BlogPost {
  reactions: Record<string, number>;
  title: string;
  date: string;
  slug: string;
  content: string; // raw HTML
  tags?: string[] | string;
  author?: string;
  toc?: TocItem[];
}

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(true);
        else setPost(data);
      })
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetch(`/api/blog/comments/${slug}?page=1`)
        .then(res => res.json())
        .then(data => {
          const all = [...(data.comments || []), ...(data.replies || [])];
          setComments(all);
          setCurrentPage(1);
          setTotalPages(data.totalPages || 1);
        });
    }
  }, [slug]);

  const handleReply = (id: number) => {
    setReplyingTo(id);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitReply = async (parentId: number) => {
    const content = replyInputs[parentId];
    if (!content || !content.trim()) return;
  
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ 
          content, 
          parent_id: parentId === 0 ? null : parentId
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        await refreshComments();
        setReplyingTo(null);
        setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post reply.");
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  const handleEdit = async (id: number, newContent: string) => {
    try {
      const res = await fetch(`/api/blog/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (res.ok) {
        await refreshComments();
        setEditingId(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to edit comment.");
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this comment?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/blog/${slug}/comments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.ok) {
        await refreshComments();
        if (editingId === id) setEditingId(null);
        if (replyingTo === id) setReplyingTo(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete comment.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const setReplyInput = (id: number, value: string) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">404 - Post Not Found</h1>
          <p className="text-gray-400 mb-4">The blog post you’re looking for doesn’t exist.</p>
          <button
            onClick={() => navigate("/blog")}
            className="bg-yellow-400 text-black font-semibold px-5 py-3 rounded hover:bg-yellow-300 transition"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const refreshComments = async () => {
    const pagesToFetch = Array.from({ length: currentPage }, (_, i) => i + 1);
    const allComments: any[] = [];
  
    for (const pageNum of pagesToFetch) {
      const res = await fetch(`/api/blog/comments/${slug}?page=${pageNum}`);
      const data = await res.json();
      const pageComments = [...(data.comments || []), ...(data.replies || [])];
      allComments.push(...pageComments);
    }
  
    setComments(allComments);
  };  

  const loadMoreComments = async () => {
    if (currentPage >= totalPages) return;
    setIsLoadingMore(true);
  
    try {
      const nextPage = currentPage + 1;
      const res = await fetch(`/api/blog/comments/${slug}?page=${nextPage}`);
      const data = await res.json();
  
      if (res.ok) {
        const more = [...(data.comments || []), ...(data.replies || [])];
        setComments((prev) => [...prev, ...more]);
        setCurrentPage(nextPage);
      } else {
        alert(data.error || "Failed to load more comments.");
      }
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (!post) return null;

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Table of Contents */}
        {post.toc && post.toc.length > 0 && (
          <aside className="w-full lg:w-1/3 lg:max-w-sm bg-[#111] border border-gray-700 rounded-lg p-4 h-fit lg:sticky top-24 self-start order-1 lg:order-2">
            <h2 className="text-lg font-semibold text-purple-300 mb-3">Table of Contents</h2>
            <a
              href="#blog-content"
              className="block mb-4 text-xs text-gray-400 underline lg:hidden"
            >
              Jump to content ↓
            </a>
            <ul className="text-sm space-y-1 pl-2">
              {post.toc.map((item, index) => (
                <li
                  key={index}
                  style={{ marginLeft: `${(item.level - 1) * 1.5}rem` }}
                  className="list-disc marker:text-purple-500 text-purple-400 hover:text-purple-300 transition"
                >
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Blog Content */}
        <div className="w-full lg:w-2/3 order-2 lg:order-1" id="blog-content">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">{post.title}</h1>

          <p className="text-sm text-gray-400 mb-1">
            {(() => {
              const rawDate = post.date;
              const parsedDate = rawDate
                ? new Date(rawDate.replace(" +0000", "Z"))
                : null;

              return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Unknown date";
            })()}
          </p>

          {post.author && (
            <p className="text-sm text-gray-500 mb-6">By {post.author}</p>
          )}

          <article
            className="prose prose-invert max-w-none text-gray-200 scroll-smooth [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-10 text-sm text-gray-500 italic">
            Tags: {Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "none"}
          </div>
          {/* Reactions */}
          <BlogPostReactions slug={post.slug} initialReactions={post.reactions} />
          {/* Comments Section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Comments</h2>
            {user && (
                <div className="mb-6">
                  <h3 className="text-sm text-gray-300 mb-2">Leave a comment</h3>
                  <textarea
                    rows={4}
                    className="w-full bg-[#1e1e22] text-white border border-gray-700 rounded p-2 text-sm mb-2"
                    placeholder="Write your comment..."
                    value={replyInputs[0] || ""}
                    onChange={(e) => setReplyInput(0, e.target.value)}
                  />
                  <button
                    onClick={() => handleSubmitReply(0)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition"
                  >
                    Post Comment
                  </button>
                </div>
              )}
            {comments.length > 0 ? (
              <BlogCommentTree
                comments={comments}
                onReply={handleReply}
                onSubmitReply={handleSubmitReply}
                onCancelReply={handleCancelReply}
                replyInputs={replyInputs}
                setReplyInput={setReplyInput}
                onEdit={handleEdit}
                onDelete={handleDelete}
                editingId={editingId}
                setEditingId={setEditingId}
                replyingTo={replyingTo}
              />
            ) : (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            )}
            {currentPage < totalPages && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreComments}
                  disabled={isLoadingMore}
                  className="bg-gray-800 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {isLoadingMore ? "Loading..." : "Load more comments"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BlogPostPage;