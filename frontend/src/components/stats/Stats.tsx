import TopShowcases from "./TopShowcases";
import PageLayout from "../PageLayout";

const StatsPage = () => {
  return (
    <PageLayout fullWidth>
      <h1 className="text-5xl font-bold text-yellow-400 text-center my-12">Stats</h1>
      <TopShowcases />
      {/* Gamemode cards will go here next */}
    </PageLayout>
  );
};

export default StatsPage;
