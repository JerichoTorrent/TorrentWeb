import { useLocation, BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LoginCallback from "./pages/LoginCallback"; // Now only handles new user email verification
import Dashboard from "./pages/Dashboard";
import VerifySuccess from "./pages/VerifySuccess";
import Map from "./pages/Map";
import Vote from "./pages/Vote";
import Blog from "./pages/Blog";
import BlogPostPage from "./pages/BlogPost";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetSuccess from "./pages/ResetSuccess";
import Rules from "./pages/Rules";
import Play from "./pages/Play";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Affiliates from "./pages/Affiliates";
import BansPage from "./pages/Bans";
import BansListPage from "./pages/BansList";
import PlayerPunishments from "./pages/PlayerPunishments";
import MyAppealsPage from "./pages/MyAppealsPage";
import AppealFormPage from "./pages/AppealFormPage";
import ThreadPage from "./pages/forums/ThreadPage";
import NewThreadPage from "./pages/forums/NewThreadPage";
import CategoryThreadsPage from "./pages/forums/CategoryThreadsPage";
import { JSX } from "react"; // Prevents JSX errors
import ForumHomePage from "./pages/forums/ForumHomePage";
import IndexPage from "./pages/forums/IndexPage";
import VerifyError from "./pages/VerifyError";
import SearchResultsPage from "./components/forums/SearchResultsPage";
import ThreadBranchPage from "./pages/forums/ThreadBranchPage";
import AccountPage from "./pages/AccountPage";
import PunishmentDetailsPage from "./pages/PunishmentDetailsPage";
import ScrollToTop from "./components/ScrollToTop";
import StatsPage from "./components/stats/Stats";
import Login2FA from "./pages/Login2FA";
import PublicProfilePage from "./pages/PublicProfile";
import NewsFeedPage from "./pages/forums/NewsFeed";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Protected route for dashboard
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>; // To do: make a fancy spinner component to reuse
  }

  return user ? children : <Navigate to="/login" />;
};

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (window.gtag && gaId) {
      window.gtag("config", gaId, {
        page_path: location.pathname,
      });
    }
  }, [location]);
}

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (window.gtag && gaId) {
      window.gtag("config", gaId, {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTracker />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-success" element={<ResetSuccess />} />
          <Route path="/verify-success" element={<VerifySuccess />} />
          <Route path="/auth/login" element={<LoginCallback />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/map" element={<Map />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/play" element={<Play />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/affiliates" element={<Affiliates />} />
          <Route path="/bans" element={<BansPage />} />
          <Route path="/bans/list" element={<BansListPage />} />
          <Route path="/bans/:uuid" element={<PlayerPunishments />} />
          <Route path="/appeals" element={<MyAppealsPage />} />
          <Route path="/appeals/:type" element={<AppealFormPage />} />
          <Route path="/forums" element={<ForumHomePage />} />
          <Route path="/forums/category/:categorySlug/thread/:id" element={<ThreadPage />} />
          <Route path="/forums/new-thread" element={<NewThreadPage />} />
          <Route path="/forums/category/:slug" element={<CategoryThreadsPage />} />
          <Route path="/forums/latest" element={<IndexPage />} />
          <Route path="/verify-error" element={<VerifyError />} />
          <Route path="/forums/search" element={<SearchResultsPage />} />
          <Route path="/forums/category/:categorySlug/thread/:id/replies/:parentId" element={<ThreadBranchPage />} />
          <Route path="/dashboard/account" element={<AccountPage />} />
          <Route path="/bans/list/:id" element={<PunishmentDetailsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/login/2fa" element={<Login2FA />} />
          <Route path="/dashboard/:username" element={<PublicProfilePage />} />
          <Route path="/forums/feed" element={<NewsFeedPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
