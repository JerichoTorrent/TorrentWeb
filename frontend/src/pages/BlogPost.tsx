import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

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
        <div className="block sm:hidden">
          <Navbar />
          <Header />
        </div>
        <div className="hidden sm:block">
          <Header />
          <Navbar />
        </div>

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
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e10] to-[#1a1a1e] text-white">
      {/* Responsive Header/Navbar layout */}
      <div className="block sm:hidden">
        <Navbar />
        <Header />
      </div>
      <div className="hidden sm:block">
        <Header />
        <Navbar />
      </div>

      {/* Responsive Blog Content + ToC */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Table of Contents (mobile first, floats right on desktop) */}
        {post.toc && post.toc.length > 0 && (
          <aside className="w-full lg:w-1/3 lg:max-w-sm bg-[#111] border border-gray-700 rounded-lg p-4 h-fit lg:sticky top-24 self-start order-1 lg:order-2">
            <h2 className="text-lg font-semibold text-purple-300 mb-3">Table of Contents</h2>
            {/* Jump to Content (mobile only) */}
            <a
              href="#blog-content"
              className="block mb-4 text-xs text-gray-400 underline lg:hidden"
            >
              Jump to content ↓
            </a>
            <ul className="space-y-2 text-sm">
              {post.toc.map((item, index) => (
                <li key={index} className={`ml-${(item.level - 1) * 4}`}>
                  <a
                    href={`#${item.id}`}
                    className="text-purple-400 hover:text-purple-300 transition"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Blog content */}
        <div className="w-full lg:w-2/3 order-2 lg:order-1" id="blog-content">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">{post.title}</h1>
          <p className="text-gray-400 text-sm mb-8">
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

          <article
            className="prose prose-invert max-w-none text-gray-200 scroll-smooth [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="mt-10 text-sm text-gray-500 italic">
            Tags:{" "}
            {Array.isArray(post.tags)
              ? post.tags.join(", ")
              : post.tags || "none"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
