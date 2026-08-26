'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData, saveData } from '@/lib/db';

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const refreshUsers = async (): Promise<any[]> => {
    const data = await fetchData();
    const users = data.users || [];
    setAllUsers(users);
    return users;
  };

  const login = async (email: string, pin: string) => {
    const data = await fetchData();
    let users: any[] = data.users || [];
    let found = users.find((u: any) => u.email === email);

    if (!found) {
      const username = email.split('@')[0];
      // ✅ Force admin for "Onlycrypty", "crypty", AND your email
      const isAdmin = username === 'Onlycrypty' || username === 'crypty' || email === 'wmax8808@gmail.com';
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
      const username = found.username || email.split('@')[0];
      // ✅ Also update existing user if they match the admin emails
      const shouldBeAdmin = username === 'Onlycrypty' || username === 'crypty' || email === 'wmax8808@gmail.com';
      if (shouldBeAdmin) {
        found.isAdmin = true;
        found.isVerified = true;
        const idx = users.findIndex((u: any) => u.id === found.id);
        if (idx !== -1) {
          users[idx] = found;
          await saveData({ ...data, users });
        }
      }
      if (found.pin !== pin) throw new Error('Incorrect PIN');
    }

    localStorage.setItem('user', JSON.stringify(found));
    setUser(found);
    setAllUsers(users);
    return found;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (updated: any) => {
    const data = await fetchData();
    const users: any[] = data.users || [];
    const idx = users.findIndex((u: any) => u.id === updated.userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      await saveData({ ...data, users });
      setUser(users[idx]);
      localStorage.setItem('user', JSON.stringify(users[idx]));
      setAllUsers(users);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    const users: any[] = await refreshUsers();
    const currentIdx = users.findIndex((u: any) => u.id === user.id);
    const targetIdx = users.findIndex((u: any) => u.id === targetUserId);
    if (currentIdx === -1 || targetIdx === -1) return;

    const current = users[currentIdx];
    const target = users[targetIdx];
    if (!current.following) current.following = [];
    if (!target.followers) target.followers = [];

    const already = current.following.includes(targetUserId);
    if (already) {
      current.following = current.following.filter((id: string) => id !== targetUserId);
      target.followers = target.followers.filter((id: string) => id !== user.id);
    } else {
      current.following.push(targetUserId);
      target.followers.push(user.id);
    }

    const data = await fetchData();
    data.users = users;
    await saveData(data);
    setAllUsers(users);
    const updatedUser = users.find((u: any) => u.id === user.id);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Also force admin when loading from localStorage
      if (parsed.username === 'Onlycrypty' || parsed.username === 'crypty' || parsed.email === 'wmax8808@gmail.com') {
        parsed.isAdmin = true;
        parsed.isVerified = true;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      setUser(parsed);
      refreshUsers();
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, allUsers, followUser, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
