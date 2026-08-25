'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// 🔥 YOUR JSONBIN CREDENTIALS
const BIN_ID = '6a8e0fb3da38895dfe106f8c';
const API_KEY = '$2a$10$r1kHroezSkMDu0f2HTVOQerg29AfetwH4AAKa6X8TDTIbliIda/OS';

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const data = await res.json();
    return data.record;
  };

  const saveData = async (data: any) => {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(data)
    });
  };

  const login = async (email: string, pin: string) => {
    const data = await fetchData();
    let users = data.users || [];
    let found = users.find((u: any) => u.email === email);

    if (!found) {
      const username = email.split('@')[0];
      // ✅ Admin check – supports both "crypty" and "Onlycrypty"
      const isAdmin = username === 'crypty' || username === 'Onlycrypty';
      found = {
        id: Date.now().toString(),
        email,
        pin,
        displayName: email.split('@')[0],
        username,
        bio: '',
        photoURL: '',
        followers: [],
        following: [],
        isAdmin,
        isVerified: isAdmin,
      };
      users.push(found);
      await saveData({ ...data, users });
    } else {
      // ✅ If user already exists, ensure admin flag is correct
      const username = found.username || email.split('@')[0];
      const shouldBeAdmin = username === 'crypty' || username === 'Onlycrypty';
      if (shouldBeAdmin && !found.isAdmin) {
        found.isAdmin = true;
        found.isVerified = true;
        const idx = users.findIndex((u: any) => u.id === found.id);
        if (idx !== -1) {
          users[idx] = found;
          await saveData({ ...data, users });
        }
      }
      if (found.pin !== pin) {
        throw new Error('Incorrect PIN');
      }
    }

    localStorage.setItem('user', JSON.stringify(found));
    setUser(found);
    return found;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (updated: any) => {
    const data = await fetchData();
    const users = data.users || [];
    const idx = users.findIndex((u: any) => u.id === updated.userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      await saveData({ ...data, users });
      setUser(users[idx]);
      localStorage.setItem('user', JSON.stringify(users[idx]));
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
