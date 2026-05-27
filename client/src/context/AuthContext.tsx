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
  hasClientActivity: boolean;
  hasWorkerActivity: boolean;
  login: (email: string, password: string) => Promise<"CLIENT" | "WORKER">;
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
  const [hasClientActivity, setHasClientActivity] = useState(false);
  const [hasWorkerActivity, setHasWorkerActivity] = useState(false);

  const applyToken = useCallback((token: string) => {
    setToken(token);
    setAccessToken(token);
  }, []);

  const detectActivity = useCallback(async (userId: string) => {
    const [jobsRes, appsRes] = await Promise.allSettled([
      api.get(`/api/jobs?clientId=${userId}&limit=1`),
      api.get("/api/applications?limit=1"),
    ]);
    const hasClient = jobsRes.status === "fulfilled" && jobsRes.value.data.total > 0;
    const hasWorker = appsRes.status === "fulfilled" && appsRes.value.data.total > 0;
    setHasClientActivity(hasClient);
    setHasWorkerActivity(hasWorker);
    return { hasClient, hasWorker };
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
      .then((res) => {
        const u = mapUser(res.data.user);
        setUser(u);
        return detectActivity(u.id);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [applyToken, detectActivity]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post("/api/auth/login", { email, password });
      applyToken(res.data.accessToken);
      const meRes = await api.get("/api/users/me");
      const u = mapUser(meRes.data.user);
      setUser(u);

      const { hasClient, hasWorker } = await detectActivity(u.id);
      const role = hasWorker && !hasClient ? "WORKER" : "CLIENT";
      localStorage.setItem("activeRole", role);
      setActiveRoleState(role);
      return role;
    },
    [applyToken, detectActivity]
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
      value={{ user, activeRole, accessToken, loading, hasClientActivity, hasWorkerActivity, login, register, logout, setActiveRole, refreshUser }}
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
