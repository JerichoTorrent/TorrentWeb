import { useState, useEffect, FormEvent, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import PageLayout from "../../components/PageLayout";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type Category = {
  id: number;
  name: string;
  slug: string;
  section: string;
};

const NewThreadPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const query = useQuery();
  const categorySlug = query.get("category");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories and optionally select one
  useEffect(() => {
    fetch("/api/forums/categories")
      .then((res) => res.json())
      .then((data) => {
        setGroupedCategories(data);

        if (categorySlug) {
          for (const section of Object.keys(data)) {
            const match = data[section].find((c: { slug: string; }) => c.slug === categorySlug);
            if (match) {
              setCategoryId(match.id);
              setSelectedCategoryName(match.name);
              break;
            }
          }
        }
      })
      .catch(() => console.error("Failed to load categories."));
  }, [categorySlug]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    setCategoryId(selectedId);

    // Find the selected category name for display
    for (const section of Object.values(groupedCategories)) {
      const found = section.find((c) => c.id === selectedId);
      if (found) {
        setSelectedCategoryName(found.name);
        break;
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content || !categoryId) {
      setError("Missing required fields.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/forums/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          title,
          content,
          is_sticky: isSticky,
          category_id: categoryId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setTimeout(() => navigate(`/forums/category/${data.categorySlug}/thread/${data.threadId}`), 1000);
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setError("Failed to submit thread.");
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center text-gray-400 py-20">
          <p>⚠ You must be logged in to post a thread.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth>
      <div className="max-w-2xl mx-auto py-16 px-4">
        <h1 className="text-3xl font-bold text-purple-400 mb-2">New Thread</h1>
        {selectedCategoryName && (
          <p className="text-sm text-gray-400 mb-6">
            Posting in <span className="text-white font-medium">{selectedCategoryName}</span>
          </p>
        )}

        {status === "success" && (
          <div className="bg-green-700 text-green-100 text-sm px-4 py-3 rounded mb-6">
            ✅ Thread submitted! Redirecting...
          </div>
        )}

        {status === "error" && error && (
          <div className="bg-red-700 text-red-100 text-sm px-4 py-3 rounded mb-6">
            ❌ {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              required
              value={categoryId ?? ""}
              onChange={handleCategoryChange}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
            >
              <option value="">Select a category</option>
              {Object.entries(groupedCategories).map(([section, cats]) => (
                <optgroup key={section} label={section}>
                  {cats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
              placeholder="Enter a descriptive title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
              placeholder="Write your post here..."
            />
          </div>

          {user.is_staff && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSticky"
                checked={isSticky}
                onChange={(e) => setIsSticky(e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600"
              />
              <label htmlFor="isSticky" className="text-sm text-gray-300">
                Make this thread sticky
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-500 transition disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Post Thread"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default NewThreadPage;
