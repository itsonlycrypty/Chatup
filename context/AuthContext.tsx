'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const BIN_ID = '6a8e0fb3da38895dfe106f8c';
const API_KEY = '$2a$10$r1kHroezSkMDu0f2HTVOQerg29AfetwH4AAKa6X8TDTIbliIda/OS';

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]); // for follow/unfollow

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
      const isAdmin = username === 'Onlycrypty' || username === 'crypty';
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
      const shouldBeAdmin = username === 'Onlycrypty' || username === 'crypty';
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
    const users = data.users || [];
    const idx = users.findIndex((u: any) => u.id === updated.userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      await saveData({ ...data, users });
      setUser(users[idx]);
      localStorage.setItem('user', JSON.stringify(users[idx]));
      setAllUsers(users);
    }
  };

  const refreshUsers = async () => {
    const data = await fetchData();
    setAllUsers(data.users || []);
    return data.users || [];
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.username === 'Onlycrypty' || parsed.username === 'crypty') {
        parsed.isAdmin = true;
        parsed.isVerified = true;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      setUser(parsed);
      refreshUsers().then(users => setAllUsers(users));
    }
    setLoading(false);
  }, []);

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    const users = await refreshUsers();
    const current = users.find((u: any) => u.id === user.id);
    const target = users.find((u: any) => u.id === targetUserId);
    if (!current || !target) return;
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
    // update current user
    const updatedUser = users.find((u: any) => u.id === user.id);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, allUsers, followUser, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
