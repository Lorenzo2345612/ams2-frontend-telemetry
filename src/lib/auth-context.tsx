import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loginUser, registerUser } from './api';

interface AuthUser {
  user_id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds;
}

function extractUser(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    user_id: (payload.sub as string) || '',
    email: (payload.email as string) || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setUser(extractUser(storedToken));
    } else if (storedToken) {
      localStorage.removeItem('token');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser(email, password);
    const newToken = response.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser({ user_id: response.user_id, email: response.email });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response = await registerUser(email, password);
    const newToken = response.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser({ user_id: response.user_id, email: response.email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
