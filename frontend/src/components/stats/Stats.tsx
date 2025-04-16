import TopShowcases from "./TopShowcases";
import PageLayout from "../PageLayout";
import GamemodeStatsSection from "./GamemodeStatsSection";

const StatsPage = () => {
  return (
    <PageLayout fullWidth>
      <h1 className="text-5xl font-bold text-yellow-400 text-center my-12">Stats</h1>
      <TopShowcases />
      <GamemodeStatsSection />
    </PageLayout>
  );
};

export default StatsPage;
