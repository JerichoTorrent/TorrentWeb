import PageLayout from "../../components/PageLayout";
import ThreadsList from "../../components/forums/ThreadsList";

const IndexPage = () => {
  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">Forum Threads</h1>
        <ThreadsList />
      </div>
    </PageLayout>
  );
};

export default IndexPage;
