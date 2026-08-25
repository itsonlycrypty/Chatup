'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { id: string; email: string; pin: string } | null;
  loading: boolean;
  login: (email: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (e) {
      console.error('Session check failed', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, pin: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    localStorage.setItem('token', data.sessionToken);
    setUser(data.user);
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
