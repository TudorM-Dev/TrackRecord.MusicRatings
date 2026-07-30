import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./auth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import ReleasePage from "./pages/ReleasePage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import AdminPage from "./pages/AdminPage";

const DEMO_USERNAME = "demo";

function Masthead() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <NavLink to="/" className="wordmark">
          Track<span>Record</span>
        </NavLink>
        <nav>
          <NavLink to="/" end className="navlink">
            record
          </NavLink>
          <NavLink to="/search" className="navlink">
            search
          </NavLink>
          <NavLink to="/friends" className="navlink">
            friends
          </NavLink>
          {user.role === "ADMIN" && (
            <NavLink to="/admin" className="navlink">
              admin
            </NavLink>
          )}
          <button className="navlink" onClick={() => void logout()}>
            log out
          </button>
        </nav>
      </div>
    </header>
  );
}

function DemoBar() {
  const { user, logout } = useAuth();

  if (user?.username !== DEMO_USERNAME) return null;

  return (
    <div className="demobar">
      <span>You are browsing a sample record. Nothing here is saved for long.</span>
      <button onClick={() => void logout()}>leave the sample</button>
    </div>
  );
}

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <p className="loading">Loading…</p>;
  if (!user) return <LandingPage />;

  return <ProfilePage />;
}

function Guarded({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="loading">Loading…</p>;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function Public({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="loading">Loading…</p>;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <div className="shell">
      <DemoBar />
      <Masthead />
      <Routes>
        <Route
          path="/login"
          element={
            <Public>
              <LoginPage />
            </Public>
          }
        />
        <Route
          path="/register"
          element={
            <Public>
              <RegisterPage />
            </Public>
          }
        />
        <Route path="/" element={<Home />} />
        <Route
          path="/search"
          element={
            <Guarded>
              <SearchPage />
            </Guarded>
          }
        />
        <Route
          path="/releases/:id"
          element={
            <Guarded>
              <ReleasePage />
            </Guarded>
          }
        />
        <Route
          path="/users/:username"
          element={
            <Guarded>
              <ProfilePage />
            </Guarded>
          }
        />
        <Route
          path="/friends"
          element={
            <Guarded>
              <FriendsPage />
            </Guarded>
          }
        />
        <Route
          path="/admin"
          element={
            <Guarded>
              <AdminPage />
            </Guarded>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
