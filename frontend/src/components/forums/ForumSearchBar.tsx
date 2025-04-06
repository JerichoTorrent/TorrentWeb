import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Props {
  categorySlug?: string; // Optional, for filtering to a category
}

const ForumSearchBar = ({ categorySlug }: Props) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/forums/search?q=${encodeURIComponent(query.trim())}${categorySlug ? `&category=${categorySlug}` : ""}`);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setUserSuggestions([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const [threadRes, userRes] = await Promise.all([
          fetch(`/api/forums/search?q=${encodeURIComponent(query)}${categorySlug ? `&category=${categorySlug}` : ""}`),
          query.includes("@")
            ? fetch(`/api/users/suggest?q=${encodeURIComponent(query.split("@").pop() || "")}`)
            : Promise.resolve({ json: async () => [] })
        ]);

        const threadData = await threadRes.json();
        const userData = await userRes.json();

        setSuggestions(threadData.threads || []);
        setUserSuggestions(userData || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);
  }, [query]);

  const handleSelectSuggestion = (threadId: number, slug: string) => {
    navigate(`/forums/category/${slug}/thread/${threadId}`);
    setShowDropdown(false);
  };

  const handleUserSelect = (username: string) => {
    const prefix = query.lastIndexOf("@");
    const newQuery = query.substring(0, prefix + 1) + username + " ";
    setQuery(newQuery);
    setUserSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto mb-6" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="flex">
        <input
          type="text"
          placeholder="Search forums..."
          className="w-full px-4 py-2 rounded-l bg-[#1e1e22] border border-gray-700 text-white focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-r hover:bg-purple-500 transition"
        >
          Search
        </button>
      </form>

      {showDropdown && (suggestions.length > 0 || userSuggestions.length > 0) && (
        <div className="absolute left-0 w-full mt-1 bg-[#2a2a2e] border border-gray-700 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {userSuggestions.length > 0 && (
            <div className="px-4 py-2 text-sm text-purple-300 border-b border-gray-700">Users</div>
          )}
          {userSuggestions.map((username, i) => (
            <div
              key={i}
              className="px-4 py-2 hover:bg-purple-600 hover:text-white cursor-pointer"
              onClick={() => handleUserSelect(username)}
            >
              @{username}
            </div>
          ))}

          {suggestions.length > 0 && (
            <div className="px-4 py-2 text-sm text-purple-300 border-b border-gray-700">Threads</div>
          )}
          {suggestions.map((thread: any) => (
            <div
              key={thread.id}
              className="px-4 py-2 hover:bg-purple-600 hover:text-white cursor-pointer"
              onClick={() => handleSelectSuggestion(thread.id, thread.category_slug)}
            >
              {thread.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumSearchBar;