import { useParams } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import ThreadsList from "../../components/forums/ThreadsList";

const CategoryThreadsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">
          Threads in {slug?.replace(/-/g, " ")}
        </h1>
        <ThreadsList categorySlug={slug} />
      </div>
    </PageLayout>
  );
};

export default CategoryThreadsPage;
