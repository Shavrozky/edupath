import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_REFRESH_TOKEN_KEY, AUTH_TOKEN_KEY } from '../api/client';

const AUTH_USER_KEY = 'edupath_auth_user';
type UserRole = 'superadmin' | 'viewer';
type AuthUser = { username: string; role: UserRole };
type AuthResponse = { accessToken: string; refreshToken: string; username: string; role: UserRole };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isSuperadmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  function clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }

  function saveSession(response: AuthResponse) {
    const nextUser = { username: response.username, role: response.role };
    localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(response.accessToken);
    setUser(nextUser);
  }

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
        if (error.response?.status === 401 && refreshToken && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          originalRequest._retry = true;
          try {
            const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
            saveSession(response.data);
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
          } catch {
            clearSession();
          }
        } else if (error.response?.status === 401) {
          clearSession();
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function login(username: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    saveSession(response.data);
  }

  function logout() {
    clearSession();
  }

  const value = useMemo(
    () => ({ token, user, isSuperadmin: user?.role === 'superadmin', isAuthenticated: Boolean(token), login, logout }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
