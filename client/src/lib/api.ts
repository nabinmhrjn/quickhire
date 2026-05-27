import axios from "axios";

// Module-level token so interceptors can read it without React context
let _token: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  withCredentials: true, // send httpOnly refresh-token cookie
});

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    const isRefresh = original.url?.includes("/api/auth/refresh");
    if (error.response?.status === 401 && !original._retry && !isRefresh) {
      original._retry = true;

      if (!_refreshPromise) {
        _refreshPromise = api
          .post("/api/auth/refresh")
          .then((res) => {
            const newToken: string = res.data.accessToken;
            setToken(newToken);
            return newToken;
          })
          .catch(() => {
            setToken(null);
            return null;
          })
          .finally(() => {
            _refreshPromise = null;
          });
      }

      const newToken = await _refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
