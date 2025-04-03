import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/PageLayout";

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
        <h1 className="text-3xl font-bold text-purple-400 mb-8 text-center">Forums</h1>

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
