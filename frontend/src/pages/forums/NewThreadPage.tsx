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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forums/categories")
      .then((res) => res.json())
      .then((data) => {
        setGroupedCategories(data);
        if (categorySlug) {
          for (const section of Object.keys(data)) {
            const match = data[section].find((c: { slug: string }) => c.slug === categorySlug);
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

  useEffect(() => {
    const getUploadToken = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch("/api/forums/auth/upload-token", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        const data = await res.json();
        if (data.token) setUploadToken(data.token);
      } catch (err) {
        console.error("Failed to fetch upload token", err);
      }
    };
  
    getUploadToken();
  }, [user]);  

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    setCategoryId(selectedId);
    for (const section of Object.values(groupedCategories)) {
      const found = section.find((c) => c.id === selectedId);
      if (found) {
        setSelectedCategoryName(found.name);
        break;
      }
    }
  };

  const handleImageUpload = async (files: FileList, retrying: boolean = false) => {
    const validFiles = Array.from(files).slice(0, 5 - uploadedImages.length);
    setUploading(true);
    try {
      for (const file of validFiles) {
        if (file.size > 3 * 1024 * 1024) {
          alert(`${file.name} is too large (max 3MB). Skipping.`);
          continue;
        }

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/forums/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "x-upload-token": uploadToken ?? "",
          },
          body: formData,
        });
      // 🔁 If token expired and we haven't retried yet
      if (res.status === 401 && !retrying) {
        console.warn("Upload token expired. Fetching new token...");
        const tokenRes = await fetch("/api/forums/auth/upload-token", {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.token) {
          setUploadToken(tokenData.token);
          return handleImageUpload(files, true); // Retry once
        } else {
          alert("Failed to refresh upload token.");
          break;
        }
      }
        const data = await res.json();

        if (res.ok && data.url) {
          setUploadedImages((prev) => [...prev, data.url]);
          setContent((prev) => `${prev}\n![](${data.url})`);
        } else {
          if (res.status === 401 && !retrying) {
            console.warn("Upload token expired. Refreshing...");
            try {
              const tokenRes = await fetch("/api/forums/auth/upload-token", {
                headers: {
                  Authorization: `Bearer ${user?.token}`,
                },
              });
              const tokenData = await tokenRes.json();
              if (tokenRes.ok && tokenData.token) {
                setUploadToken(tokenData.token);
                alert("Upload token expired. Please try uploading that image again.");
                return; // exit this upload attempt
              } else {
                setUploadToken(null);
                alert("Upload token expired. Please try uploading again.");
              }
            } catch (err) {
              console.error("Failed to refresh upload token:", err);
              setUploadToken(null);
              alert("Upload token expired. Please try again.");
            }
          } else {
            alert(data.error || `Upload failed for ${file.name}`);
          }
        }           
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload error.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent || !categoryId) {
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
          title: trimmedTitle,
          content: trimmedContent,
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

          <div className="mb-4">
            <label className="block text-sm text-white mb-1">Attach up to 5 images (3MB max each):</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleImageUpload(e.target.files);
              }}
              className="text-white"
            />
            {uploading && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
            {uploadedImages.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-4">
                {uploadedImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Uploaded ${i + 1}`}
                    className="max-w-full border border-gray-700 rounded"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
              placeholder="Write your markdown post here..."
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
