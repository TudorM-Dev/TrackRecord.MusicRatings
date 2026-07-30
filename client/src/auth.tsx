import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "./api";
import type { CurrentUser } from "./types";

type AuthState = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  demo: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CurrentUser) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CurrentUser>("/api/auth/me")
      .then(setUser)
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 401)) {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const loggedIn = await api.post<CurrentUser>("/api/auth/login", {
      email,
      password,
    });
    setUser(loggedIn);
  }

  async function register(email: string, username: string, password: string) {
    await api.post("/api/auth/register", { email, username, password });
    await login(email, password);
  }

  async function demo() {
    const loggedIn = await api.post<CurrentUser>("/api/auth/demo");
    setUser(loggedIn);
  }

  async function logout() {
    await api.post("/api/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, demo, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
