import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center text-xs text-gray-400">
      <Link to="/" className="hover:text-yellow-400 transition">Home</Link>
      {pathnames.map((segment, index) => {
        const path = "/" + pathnames.slice(0, index + 1).join("/");
        const label = decodeURIComponent(segment).replace(/-/g, " ");

        return (
          <span key={path} className="flex items-center gap-1">
            <span className="mx-1 text-gray-500">/</span>
            <Link to={path} className="hover:text-yellow-400 transition capitalize">
              {label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
