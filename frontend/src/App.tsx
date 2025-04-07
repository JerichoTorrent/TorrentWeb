import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
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
import { JSX } from "react"; // ✅ Prevents JSX errors
import ForumHomePage from "./pages/forums/ForumHomePage";
import IndexPage from "./pages/forums/IndexPage";
import VerifyError from "./pages/VerifyError";
import SearchResultsPage from "./components/forums/SearchResultsPage";
import ThreadBranchPage from "./pages/forums/ThreadBranchPage";

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="/appeals/my" element={<MyAppealsPage />} />
          <Route path="/appeals/:type" element={<AppealFormPage />} />
          <Route path="/forums" element={<ForumHomePage />} />
          <Route path="/forums/category/:categorySlug/thread/:id" element={<ThreadPage />} />
          <Route path="/forums/new-thread" element={<NewThreadPage />} />
          <Route path="/forums/category/:slug" element={<CategoryThreadsPage />} />
          <Route path="/forums/latest" element={<IndexPage />} />
          <Route path="/verify-error" element={<VerifyError />} />
          <Route path="/forums/search" element={<SearchResultsPage />} />
          <Route path="/forums/category/:categorySlug/thread/:id/replies/:parentId" element={<ThreadBranchPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
