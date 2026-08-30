'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData, saveData } from '@/lib/db';

// Mock SMS verification – in production, use Twilio or a similar service.
const sendVerificationCode = async (phone: string): Promise<string> => {
  // Simulate sending a code (for demo, always returns '1234')
  console.log(`Sending verification code to ${phone}`);
  return '1234';
};

const AuthContext = createContext<any>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Pre‑fill admin account (Crypty) – auto‑verified
  const ADMIN_PHONE = '2347016334222';
  const ADMIN_EMAIL = 'wmax8808@gmail.com';
  const ADMIN_PIN = '2444';

  const refreshUsers = async () => {
    const data = await fetchData();
    const users = data.users || [];
    setAllUsers(users);
    return users;
  };

  // ----- Send verification code -----
  const requestVerification = async (phone: string) => {
    if (phone === ADMIN_PHONE) return '1234'; // auto‑verify admin
    return await sendVerificationCode(phone);
  };

  // ----- Login / Signup with phone + code -----
  const loginWithPhone = async (phone: string, code: string, email?: string, pin?: string) => {
    // For admin, auto‑verify any code
    if (phone === ADMIN_PHONE) {
      // Find or create admin user
      let users = await refreshUsers();
      let found = users.find((u: any) => u.phone === phone);
      if (!found) {
        found = {
          id: `user_${Date.now()}`,
          phone,
          email: ADMIN_EMAIL,
          pin: ADMIN_PIN,
          displayName: 'Crypty',
          username: 'Onlycrypty',
          bio: 'The owner',
          photoURL: '',
          isVerified: true, // verified badge
          isAdmin: true, // still admin for channel/group permissions, but we remove "Owner" badge in profile
          followers: Array(4000000).fill('dummy'),
          following: [],
          totalLikes: 19000000,
          privacy: {
            stories: 'everyone', // everyone, friends, selected, nobody
            posts: 'everyone',
          },
          createdAt: new Date().toISOString(),
        };
        users.push(found);
        await saveData({ ...(await fetchData()), users });
      }
      setUser(found);
      localStorage.setItem('user', JSON.stringify(found));
      return found;
    }

    // For other users: verify code (mock)
    if (code !== '1234') throw new Error('Invalid verification code');

    let users = await refreshUsers();
    let found = users.find((u: any) => u.phone === phone);
    if (!found) {
      // New user
      const username = phone.slice(-4);
      found = {
        id: `user_${Date.now()}`,
        phone,
        email: email || '',
        pin: pin || '',
        displayName: `User ${username}`,
        username: `user_${username}`,
        bio: '',
        photoURL: '',
        isVerified: false,
        isAdmin: false,
        followers: [],
        following: [],
        totalLikes: 0,
        privacy: {
          stories: 'everyone',
          posts: 'everyone',
        },
        createdAt: new Date().toISOString(),
      };
      users.push(found);
      await saveData({ ...(await fetchData()), users });
    } else {
      // Update email/pin if provided
      if (email) found.email = email;
      if (pin) found.pin = pin;
      const idx = users.findIndex((u: any) => u.phone === phone);
      if (idx !== -1) {
        users[idx] = found;
        await saveData({ ...(await fetchData()), users });
      }
    }
    setUser(found);
    localStorage.setItem('user', JSON.stringify(found));
    return found;
  };

  // ----- Login with email + pin (for users who set up email/pin) -----
  const loginWithEmail = async (email: string, pin: string) => {
    const users = await refreshUsers();
    const found = users.find((u: any) => u.email === email && u.pin === pin);
    if (!found) throw new Error('Invalid email or PIN');
    setUser(found);
    localStorage.setItem('user', JSON.stringify(found));
    return found;
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
      const parsed = JSON.parse(saved);
      setUser(parsed);
      refreshUsers();
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      allUsers,
      loginWithPhone,
      requestVerification,
      loginWithEmail,
      logout,
      updateUser,
      refreshUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
