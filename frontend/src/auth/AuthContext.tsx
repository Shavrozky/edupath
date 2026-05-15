import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY } from '../api/client';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  async function login(username: string, password: string) {
    const response = await api.post<{ accessToken: string }>('/auth/login', { username, password });
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.accessToken);
    setToken(response.data.accessToken);
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
  }

  const value = useMemo(
    () => ({ token, isAuthenticated: Boolean(token), login, logout }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
