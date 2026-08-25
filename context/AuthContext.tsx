'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('chatup_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (email: string, pin: string) => {
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    let found = users.find((u: any) => u.email === email);
    
    if (!found) {
      // Create new user
      found = { id: Date.now().toString(), email, pin };
      users.push(found);
      localStorage.setItem('chatup_users', JSON.stringify(users));
    } else if (found.pin !== pin) {
      throw new Error('Incorrect PIN');
    }
    
    localStorage.setItem('chatup_user', JSON.stringify(found));
    setUser(found);
  };

  const logout = () => {
    localStorage.removeItem('chatup_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
