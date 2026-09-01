'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData, saveData } from '@/lib/db';

const sendVerificationCodeToEmail = async (email: string, code: string) => {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: 'Your Chat Up Verification Code',
      text: `Your verification code is: ${code}\n\nEnter this code to complete your signup.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>Enter this code to complete your signup.</p>`,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to send email');
  }
};

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const ADMIN_DATA = {
    id: `user_admin_${Date.now()}`,
    displayName: 'Chat up',
    username: 'chatup',
    phone: '07030772505',
    email: 'wmax8808@gmail.com',
    pin: '2444',
    bio: 'Demo account',
    photoURL: '',
    isVerified: true,
    isAdmin: true,
    followers: [],
    following: [],
    totalLikes: 0,
    privacy: { stories: 'everyone', posts: 'everyone' },
    createdAt: new Date().toISOString(),
  };

  const verificationStore = new Map<string, string>();

  const refreshUsers = async () => {
    const data = await fetchData();
    const users = data.users || [];
    setAllUsers(users);
    return users;
  };

  const ensureAdminExists = async () => {
    const users = await refreshUsers();
    const exists = users.find((u: any) => u.email === ADMIN_DATA.email);
    if (!exists) {
      users.push(ADMIN_DATA);
      const data = await fetchData();
      await saveData({ ...data, users });
    }
  };

  const requestEmailVerification = async (email: string): Promise<void> => {
    const users = await refreshUsers();
    const exists = users.find((u: any) => u.email === email.trim());
    if (exists) throw new Error('Email already registered. Please log in.');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationStore.set(email.trim(), code);
    await sendVerificationCodeToEmail(email.trim(), code);
  };

  const verifyEmailCode = async (email: string, phone: string, pin: string, code: string): Promise<void> => {
    const stored = verificationStore.get(email.trim());
    if (!stored || stored !== code.trim()) {
      throw new Error('Invalid or expired verification code.');
    }

    const users = await refreshUsers();
    const exists = users.find((u: any) => u.email === email.trim() || u.phone === phone.trim());
    if (exists) throw new Error('User already exists.');

    const newUser = {
      id: `user_${Date.now()}`,
      displayName: phone.trim(),
      username: `user_${phone.slice(-4)}`,
      phone: phone.trim(),
      email: email.trim(),
      pin: pin.trim(),
      bio: '',
      photoURL: '',
      isVerified: false,
      isAdmin: false,
      followers: [],
      following: [],
      totalLikes: 0,
      privacy: { stories: 'everyone', posts: 'everyone' },
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    const data = await fetchData();
    await saveData({ ...data, users });

    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    verificationStore.delete(email.trim());
  };

  const loginWithEmail = async (email: string, pin: string) => {
    const users = await refreshUsers();
    const found = users.find((u: any) => u.email === email.trim());
    if (!found) throw new Error('No account with that email.');
    if (found.pin !== pin.trim()) throw new Error('Incorrect PIN.');
    setUser(found);
    localStorage.setItem('user', JSON.stringify(found));
  };

  const loginWithPhone = async (phone: string, pin: string) => {
    const users = await refreshUsers();
    const found = users.find((u: any) => u.phone === phone.trim());
    if (!found) throw new Error('No account with that phone number.');
    if (found.pin !== pin.trim()) throw new Error('Incorrect PIN.');
    setUser(found);
    localStorage.setItem('user', JSON.stringify(found));
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (updated: any) => {
    const data = await fetchData();
    const users = data.users || [];
    const idx = users.findIndex((u: any) => u.id === updated.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updated };
      await saveData({ ...data, users });
      setUser(users[idx]);
      localStorage.setItem('user', JSON.stringify(users[idx]));
      setAllUsers(users);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {}
    }
    ensureAdminExists().then(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        allUsers,
        loginWithEmail,
        loginWithPhone,
        requestEmailVerification,
        verifyEmailCode,
        logout,
        updateUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
