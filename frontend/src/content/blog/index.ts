import fm from 'front-matter';

export interface PostMetadata {
  title: string;
  date: string;
  description: string;
  tags?: string[];
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
    const { attributes, body } = fm<PostMetadata>(raw);

    const slug = path.split('/').pop()?.replace('.markdown', '') ?? '';
    posts.push({
      metadata: {
        ...attributes,
        slug,
      },
      content: body,
      slug,
    });
  }

  return posts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
}