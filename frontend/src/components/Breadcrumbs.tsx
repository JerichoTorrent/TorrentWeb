import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);
  const ignoredSegments = new Set(["category", "thread"]);

  const state = location.state as { threadTitle?: string; title?: string } | null;
  const threadTitle = state?.threadTitle;
  const pageTitle = state?.title;

  // Capitalize each word
  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <nav className="flex items-center text-xs text-gray-400">
      <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
      {pathnames.map((segment, index) => {
        if (ignoredSegments.has(segment)) return null;

        const isLast = index === pathnames.length - 1;
        const path = "/" + pathnames.slice(0, index + 1).join("/");

        let label = decodeURIComponent(segment).replace(/-/g, " ");
        label = label.charAt(0).toUpperCase() + label.slice(1);
        if (isLast) {
          if (threadTitle) label = threadTitle;
          else if (pageTitle) label = pageTitle;
          else label = capitalizeWords(label);
        } else {
          label = capitalizeWords(label);
        }

        return (
          <span key={path} className="flex items-center gap-1">
            <span className="mx-1 text-gray-500">/</span>
            {isLast ? (
              <span className="text-white">{label}</span>
            ) : (
              <Link to={path} className="hover:text-yellow-400 transition">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
