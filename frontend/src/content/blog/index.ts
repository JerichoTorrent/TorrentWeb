import fm from 'front-matter';

export interface PostMetadata {
  title: string;
  date: string;
  description: string;
  tags?: string[];
  author?: string;
  slug: string;
}

export interface Post {
  metadata: PostMetadata;
  content: string;
  slug: string;
}

export async function getAllPosts(): Promise<Post[]> {
  const files = import.meta.glob('./*.markdown', { as: 'raw', eager: true });
  const posts: Post[] = [];

  for (const path in files) {
    const raw = files[path] as string;

    // Allow any frontmatter attributes to be parsed
    const { attributes, body } = fm<any>(raw);

    const slug = path.split('/').pop()?.replace('.markdown', '') ?? '';

    // Extract fields with fallback to undefined
    const {
      title,
      date,
      description,
      tags,
      author,
    } = attributes;

    posts.push({
      metadata: {
        title,
        date,
        description,
        tags,
        author,
        slug,
      },
      content: body,
      slug,
    });
  }

  return posts.sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
  );
}
