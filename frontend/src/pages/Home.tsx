import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import SplashHero from "../components/SplashHero";

type Post = {
  slug: string;
  metadata: {
    title: string;
    date: string;
    description: string;
    author?: string;
    tags?: string[];
  };
};

const Homepage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts([]);
        }
      })
      .catch(() => setPosts([]));
  }, []);

  const latestPost = posts[0];
  const rawDate = latestPost?.metadata.date;
  const parsedDate = rawDate ? new Date(rawDate.replace(" +0000", "Z")) : null;
  const displayDate =
    parsedDate instanceof Date && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown date";

  return (
    <PageLayout fullWidth>
      {/* Override padding and constraints just for SplashHero */}
      <div className="relative -mt-16 -mx-4 sm:-mx-8 md:-mx-12 lg:-mx-20 xl:-mx-32">
        <SplashHero />
      </div>

      <h1 className="text-4xl font-bold text-yellow-400 text-center mb-10 mt-4">
        Welcome to Torrent Network
      </h1>

      {latestPost ? (
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-center text-purple-300 mb-6">
            Latest Blog Post
          </h2>
          <div className="bg-[#1e1e22] p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow max-w-3xl mx-auto">
            <Link to={`/blog/${latestPost.slug}`}>
              <h3 className="text-2xl font-semibold text-purple-300 hover:text-purple-400 transition-colors">
                {latestPost.metadata.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-400 mb-1">{displayDate}</p>
            {latestPost.metadata.author && (
              <p className="text-sm text-gray-500 mb-1">
                By {latestPost.metadata.author}
              </p>
            )}
            <div
              className="prose prose-invert prose-p:leading-relaxed prose-p:mb-4 max-w-none text-gray-300"
              dangerouslySetInnerHTML={{
                __html: latestPost.metadata.description,
              }}
            />
            <Link
              to={`/blog/${latestPost.slug}`}
              className="inline-block mt-4 text-purple-400 hover:text-purple-300 transition"
            >
              Read more →
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-10">
          No blog post found.
        </p>
      )}
    </PageLayout>
  );
};

export default Homepage;
