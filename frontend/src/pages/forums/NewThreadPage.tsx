import { useState, useEffect, FormEvent, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import PageLayout from "../../components/PageLayout";
import { MentionsInput, Mention } from "react-mentions";
import mentionStyle from "../../styles/mentionStyle";
import debounce from "lodash.debounce";

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
  const isStaffAppCategory = selectedCategoryName === "Staff Applications";
  const [app, setApp] = useState({
    discord: "",
    minecraft: user?.username ?? "",
    age: "",
    experience: "",
    strengths: "",
    timePlayed: "",
    punishments: "",
    whyHire: "",
    availability: "",
  });
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; display: string }[]>([]);

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

  useEffect(() => {
    if (!user?.token) return;
  
    const interval = setInterval(() => {
      fetch("/api/forums/uploads/ping", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }).catch((err) => {
        console.warn("Ping failed", err);
      });
    }, 5 * 60 * 1000); // every 5 minutes
  
    return () => clearInterval(interval); // cleanup on unmount
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

        // Handle expired token BEFORE parsing
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
            continue;
          }
        }

        // Parse the response safely
        const text = await res.text();
        let data: any;

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Server returned invalid JSON:", text);
          alert("Upload failed. Unexpected server response.");
          continue;
        }

        // Only insert image ONCE and only if valid
        if (res.ok && data.url) {
          // Avoid duplicates (just in case)
          if (!uploadedImages.includes(data.url)) {
            setUploadedImages((prev) => [...prev, data.url]);
            setContent((prev) => `${prev}\n![](${data.url})`);
          }
        } else {
          alert(data.error || `Upload failed for ${file.name}`);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload error.");
    } finally {
      setUploading(false);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const res = await fetch(`/api/users/suggest?q=${query}`);
      const users = await res.json();
      if (Array.isArray(users)) {
        const cleaned = users.filter((u) => u && typeof u === "object" && u.id && u.display);
        setSuggestions(cleaned);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Mention fetch failed:", err);
      setSuggestions([]);
    }
  };
  
  const loadSuggestionsDebounced = debounce((query: string) => {
    loadSuggestions(query);
  }, 300);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!categoryId) {
      setError("Missing category.");
      return;
    }

    const finalTitle = isStaffAppCategory
      ? `${user?.username ?? "Unknown"}'s Staff Application`
      : trimmedTitle;

    const finalContent = isStaffAppCategory
      ? `**1. Discord Username:** ${app.discord}
**2. Minecraft Username:** ${app.minecraft}
**3. Age:** ${app.age}
**4. Staff Experience:** ${app.experience}
**5. Strengths:** ${app.strengths}
**6. Time Played:** ${app.timePlayed}
**7. Punishment History:** ${app.punishments}
**8. Why Hire Me:** ${app.whyHire}
**9. Availability:** ${app.availability}`
      : trimmedContent;

    if (!finalTitle || !finalContent) {
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
          title: finalTitle,
          content: finalContent,
          is_sticky: isSticky,
          category_id: categoryId,
          is_private: isStaffAppCategory,
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

          {isStaffAppCategory ? (
            <>
              <p className="text-sm text-gray-400 mb-3">Please fill out the following questionnaire:</p>

              {[
                { key: "discord", label: "1. What is your Discord username and display name?" },
                { key: "minecraft", label: "2. What is your Minecraft username?" },
                { key: "age", label: "3. What is your age? (range is okay)" },
                { key: "experience", label: "4. Do you have prior staff experience? Describe in detail." },
                { key: "strengths", label: "5. Which areas do you excel in?" },
                { key: "timePlayed", label: "6. How long have you played on our Network / Minecraft?" },
                { key: "punishments", label: "7. Do you have a punishment history? Describe if so." },
                { key: "whyHire", label: "8. Why should we hire you?" },
                { key: "availability", label: "9. What days/times can you be most active?" },
              ].map((q) => (
                <div key={q.key} className="mb-4">
                  <label className="block text-sm text-white mb-1">{q.label}</label>
                  <textarea
                    required
                    value={app[q.key as keyof typeof app]}
                    onChange={(e) =>
                      setApp((prev) => ({ ...prev, [q.key]: e.target.value }))
                    }
                    className="w-full rounded bg-[#1e1e22] border border-gray-700 p-3 text-white"
                    rows={3}
                  />
                </div>
              ))}
            </>
          ) : (
            <>
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
                <MentionsInput
                  value={content}
                  onChange={(e) => {
                    const value = e.target.value;
                    setContent(value);

                    const lastWord = value.split(/\s+/).pop() || "";
                    if (lastWord.startsWith("@") && lastWord.length > 1) {
                      loadSuggestionsDebounced(lastWord.slice(1));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const event = new KeyboardEvent("keydown", {
                        key: "Enter",
                        bubbles: true,
                        cancelable: true,
                      });
                      e.currentTarget.dispatchEvent(event);
                    }
                  }}
                  placeholder="Write your markdown post here..."
                  style={mentionStyle}
                  allowSuggestionsAboveCursor
                >
                  <Mention trigger="@" data={suggestions} appendSpaceOnAdd />
                </MentionsInput>
              </div>
            </>
          )}

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
