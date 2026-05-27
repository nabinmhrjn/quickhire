import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, setToken } from "@/lib/api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  activeRole: "CLIENT" | "WORKER";
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveRole: (role: "CLIENT" | "WORKER") => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(raw: { _id?: string; id?: string; name: string; email: string; avatarUrl?: string }): AuthUser {
  return { id: raw._id ?? raw.id ?? "", name: raw.name, email: raw.email, avatarUrl: raw.avatarUrl };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<"CLIENT" | "WORKER">(() => {
    return (localStorage.getItem("activeRole") as "CLIENT" | "WORKER") ?? "CLIENT";
  });

  const applyToken = useCallback((token: string) => {
    setToken(token);
    setAccessToken(token);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/api/users/me");
    setUser(mapUser(res.data.user));
  }, []);

  // On mount: try to restore session via refresh-token cookie
  useEffect(() => {
    api
      .post("/api/auth/refresh")
      .then((res) => {
        applyToken(res.data.accessToken);
        return api.get("/api/users/me");
      })
      .then((res) => setUser(mapUser(res.data.user)))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [applyToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post("/api/auth/login", { email, password });
      applyToken(res.data.accessToken);
      const meRes = await api.get("/api/users/me");
      setUser(mapUser(meRes.data.user));
    },
    [applyToken]
  );

  const register = useCallback(async (name: string, email: string, password: string) => {
    await api.post("/api/auth/register", { name, email, password });
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setToken(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  const setActiveRole = useCallback((role: "CLIENT" | "WORKER") => {
    localStorage.setItem("activeRole", role);
    setActiveRoleState(role);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, activeRole, accessToken, loading, login, register, logout, setActiveRole, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
