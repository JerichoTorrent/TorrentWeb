import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";
import ForumSearchBar from "../../components/forums/ForumSearchBar";
import.meta.env.VITE_API_BASE_URL

type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
};

type CategoryGroup = {
  [section: string]: Category[];
};

const ForumHomePage = () => {
  const [groups, setGroups] = useState<CategoryGroup>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/forums/categories");
        const data = await res.json();
        console.log("📁 Loaded forum categories:", data);
        setGroups(data || {});
      } catch (err) {
        console.error("Failed to load forum categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <PageLayout fullWidth>
      <div className="max-w-5xl mx-auto py-16 px-4">
        {/* Info Box */}
        <div className="bg-[#1e1e22] border border-gray-700 rounded-lg p-6 mb-12 flex flex-col md:flex-row gap-6 items-center">
          <img src="/torrent_small.png" alt="Torrent Logo" className="w-24 h-24 object-contain" />
          <ul className="text-sm text-gray-300 space-y-2">
            <li>
              In order to <strong>appeal a ban or mute</strong>, please{" "}
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}/bans#appeals`}
                className="text-purple-400 hover:underline"
              >
                click here
              </a>.
            </li>
            <li>
              In order to open a <strong>report against a player</strong>, please file a report ticket in our{" "}
              <a
                href="https://discord.gg/torrent"
                className="text-purple-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>.
            </li>
            <li>
              In order to submit a <strong>bug report</strong>, please{" "}
              <a
                href="#"
                className="text-purple-400 hover:underline"
              >
                click here
              </a>.
            </li>
            <li>
              Please read our <strong>Network Rules</strong> by{" "}
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}/rules`}
                className="text-purple-400 hover:underline"
              >
                clicking here
              </a>.
            </li>
            <li>
              For <strong>further questions and guides</strong>, please view our{" "}
              <a
                href="https://wiki.torrentsmp.com"
                className="text-purple-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                wiki
              </a>.
            </li>
          </ul>
        </div>
  
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">Forums</h1>
        <ForumSearchBar />
  
        {Object.keys(groups).length === 0 ? (
          <p className="text-center text-gray-500">No categories found.</p>
        ) : (
          Object.entries(groups).map(([section, categories]) => (
            <div key={section} className="mb-12">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">{section}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-[#1e1e22] border border-gray-700 rounded-lg p-4 hover:border-purple-500 cursor-pointer transition"
                    onClick={() => navigate(`/forums/category/${cat.slug}`)}
                  >
                    <h3 className="text-lg font-medium text-purple-300">{cat.name}</h3>
                    <p className="text-sm text-gray-400">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );  
};

export default ForumHomePage;
