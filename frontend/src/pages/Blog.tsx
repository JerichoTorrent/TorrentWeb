import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

const POSTS_PER_PAGE = 10;

type Post = {
  slug: string;
  metadata: {
    title: string;
    date: string;
    description: string;
  };
};

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("⚠️ Blog API returned invalid format:", data);
          setPosts([]);
        }
      })
      .catch((err) => console.error("Failed to fetch blog posts:", err));
  }, []);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <PageLayout fullWidth>
      <h1 className="text-4xl font-bold text-yellow-400 mb-10 text-center pt-2 md:mt-8">
        Blog
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Blog posts */}
        <div className="flex-grow min-w-0 space-y-10">
          {currentPosts.map((post) => {
            const rawDate = post.metadata.date;
            const parsedDate = rawDate
              ? new Date(rawDate.replace(" +0000", "Z"))
              : null;

            const displayDate =
              parsedDate instanceof Date && !isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString()
                : "Unknown date";

            return (
              <div
                key={post.slug}
                className="w-full bg-[#1e1e22] p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
              >
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-semibold text-purple-300 hover:text-purple-400 transition-colors">
                    {post.metadata.title}
                  </h2>
                </Link>
                <p className="text-sm text-gray-400 mb-3">{displayDate}</p>
                <div
                  className="prose prose-invert prose-p:leading-relaxed prose-p:mb-4 max-w-none text-gray-300"
                  dangerouslySetInnerHTML={{ __html: post.metadata.description }}
                />
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-block mt-4 text-purple-400 hover:text-purple-300 transition"
                >
                  Read more →
                </Link>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-purple-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts sidebar (desktop only) */}
        <aside className="hidden lg:block w-[16rem] flex-shrink-0 sticky top-24 self-start">
          <div className="bg-[#111] border border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-purple-300 mb-3">Recent Posts</h2>
            <ul className="text-sm space-y-2 pl-1 list-disc marker:text-purple-500 text-purple-400">
              {posts.slice(0, 10).map((post) => (
                <li key={post.slug}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="hover:text-purple-300 transition"
                  >
                    {post.metadata.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
};

export default Blog;
