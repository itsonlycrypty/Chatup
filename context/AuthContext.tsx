'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, pin: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('chatup_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (email: string, pin: string) => {
    const users = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    let found = users.find((u: any) => u.email === email);

    if (!found) {
      found = {
        id: Date.now().toString(),
        email,
        pin,
        displayName: email.split('@')[0],
        username: email.split('@')[0],
        bio: '',
        photoURL: '',
        followers: [],
        following: [],
      };
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

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('chatup_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
