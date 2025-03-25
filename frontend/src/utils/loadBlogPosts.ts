import matter from "gray-matter";

export type BlogPostMeta = {
  title: string;
  date: string;
  slug: string;
  tags?: string[];
  categories?: string[];
  description?: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

export const loadBlogPosts = async (): Promise<BlogPost[]> => {
  const markdownFiles = import.meta.glob("/src/content/blog/*.markdown", {
    as: "raw",
    eager: true,
  });

  const posts: BlogPost[] = [];

  for (const path in markdownFiles) {
    const raw = markdownFiles[path];
    const { data, content } = matter(raw);

    // Infer slug from filename (e.g. 2024-09-14-Linux_Pain.markdown → linux-pain)
    const filename = path.split("/").pop() || "";
    const slug = filename
      .replace(/\.markdown$/, "")
      .split("-")
      .slice(3)
      .join("-")
      .toLowerCase();

    posts.push({
      ...data,
      slug,
      content,
    } as BlogPost);
  }

  // Sort newest first
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
