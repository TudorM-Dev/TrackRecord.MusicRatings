import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./auth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import ReleasePage from "./pages/ReleasePage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";

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
          <button className="navlink" onClick={() => void logout()}>
            log out
          </button>
        </nav>
      </div>
    </header>
  );
}

function Guarded({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="loading">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;

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
        <Route
          path="/"
          element={
            <Guarded>
              <ProfilePage />
            </Guarded>
          }
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
