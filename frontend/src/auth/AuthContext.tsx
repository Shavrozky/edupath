import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY } from '../api/client';

const AUTH_USER_KEY = 'edupath_auth_user';
type UserRole = 'superadmin' | 'viewer';
type AuthUser = { username: string; role: UserRole };

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

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function login(username: string, password: string) {
    const response = await api.post<{ accessToken: string; username: string; role: UserRole }>('/auth/login', { username, password });
    const nextUser = { username: response.data.username, role: response.data.role };
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(response.data.accessToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
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
