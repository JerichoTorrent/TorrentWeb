import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";

interface TocItem {
  text: string;
  level: number;
  id: string;
}

interface BlogPost {
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

  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(true);
        else setPost(data);
      })
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* You can wrap this in <PageLayout> too if you want consistent header/nav */}
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
        </div>
      </div>
    </PageLayout>
  );
};

export default BlogPostPage;
