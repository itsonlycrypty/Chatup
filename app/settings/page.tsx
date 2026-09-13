'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import {
  FaUser, FaComment, FaLock, FaBell, FaDatabase, FaFolder, FaLaptop,
  FaBatteryHalf, FaGlobe, FaCamera, FaChevronRight, FaArrowLeft, FaTrash, FaSignOutAlt
} from 'react-icons/fa';

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'account'>('menu');

  // account edit state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoURL(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveAccount = async () => {
    setSaving(true);
    try {
      const data = await fetchData();
      const users = data.users || [];
      const existing = users.find((u: any) => u.username === username && u.id !== user.id);
      if (existing) {
        alert('Username already taken.');
        setSaving(false);
        return;
      }
      const idx = users.findIndex((u: any) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], displayName, username, bio, phone, photoURL };
        await saveData({ ...data, users });
        // update local user
        const updated = { ...user, displayName, username, bio, phone, photoURL };
        localStorage.setItem('user', JSON.stringify(updated));
        alert('Profile updated!');
      }
    } catch (err) {
      alert('Failed to save');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-[#5288c1] rounded-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/profile');
    return null;
  }

  // ---------- ACCOUNT EDIT VIEW ----------
  if (view === 'account') {
    return (
      <div className="min-h-screen bg-[#0e1621] pb-24">
        <div className="flex items-center gap-4 px-4 pt-5 pb-3">
          <button onClick={() => setView('menu')} className="text-[#7f91a4]">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex-1">Account</h1>
          <button
            onClick={saveAccount}
            disabled={saving}
            className="text-[#5288c1] font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="flex flex-col items-center mt-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#232e3c]">
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-white bg-[#2f6ea8]">
                  {(displayName || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#5288c1] border-4 border-[#0e1621] flex items-center justify-center cursor-pointer">
              <FaCamera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>

        <div className="mx-4 mt-6 bg-[#17212b] rounded-2xl px-4 divide-y divide-[#0e1621]">
          <div className="py-3">
            <label className="text-[#7f91a4] text-xs">Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent text-white text-[15px] focus:outline-none mt-1"
            />
          </div>
          <div className="py-3">
            <label className="text-[#7f91a4] text-xs">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent text-white text-[15px] focus:outline-none mt-1"
            />
          </div>
          <div className="py-3">
            <label className="text-[#7f91a4] text-xs">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-white text-[15px] focus:outline-none mt-1 resize-none"
            />
          </div>
          <div className="py-3">
            <label className="text-[#7f91a4] text-xs">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent text-white text-[15px] focus:outline-none mt-1"
            />
          </div>
        </div>

        <div className="mx-4 mt-6">
          <button
            onClick={async () => {
              if (confirm('Delete account? This cannot be undone.')) {
                const data = await fetchData();
                const users = (data.users || []).filter((u: any) => u.id !== user.id);
                await saveData({ ...data, users });
                logout();
                router.push('/');
              }
            }}
            className="w-full bg-transparent border border-red-500 text-red-500 py-3 rounded-xl font-medium"
          >
            <FaTrash className="inline mr-2" /> Delete Account
          </button>
        </div>
      </div>
    );
  }

  // ---------- MENU VIEW ----------
  const menuItems = [
    { icon: FaUser, bg: '#5288c1', title: 'Account', sub: 'Number, Username, Bio', action: () => setView('account') },
    { icon: FaComment, bg: '#e8a33d', title: 'Chat Settings', sub: 'Wallpaper, Night Mode, Animations', action: () => {} },
    { icon: FaLock, bg: '#4dcd5e', title: 'Privacy & Security', sub: 'Last Seen, Devices, Passkeys', action: () => {} },
    { icon: FaBell, bg: '#e05a5a', title: 'Notifications', sub: 'Sounds, Calls, Badges', action: () => {} },
    { icon: FaDatabase, bg: '#3a95d1', title: 'Data and Storage', sub: 'Media download settings', action: () => {} },
    { icon: FaFolder, bg: '#3a95d1', title: 'Chat Folders', sub: 'Sort chats into folders', action: () => {} },
    { icon: FaLaptop, bg: '#3abdd1', title: 'Devices', sub: 'Manage connected devices', action: () => {} },
    { icon: FaBatteryHalf, bg: '#e88a3d', title: 'Power Saving', sub: 'Reduce power usage on low charge', action: () => {} },
    { icon: FaGlobe, bg: '#a05ad1', title: 'Language', sub: 'English', action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-[#0e1621] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <button className="text-[#7f91a4]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
        </button>
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#232e3c]">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-white bg-[#2f6ea8]">
                {(user.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5288c1] border-4 border-[#0e1621] flex items-center justify-center">
            <FaCamera size={12} className="text-white" />
          </div>
        </div>
        <h2 className="text-white text-xl font-bold mt-3">
          {user.displayName || user.username || 'User'}
        </h2>
        <p className="text-[#7f91a4] text-sm">
          {user.phone} {user.username && `· @${user.username}`}
        </p>
      </div>

      {/* Menu */}
      <div className="mx-4 bg-[#17212b] rounded-2xl overflow-hidden">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#1c2733] border-b border-[#0e1621] last:border-b-0"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.bg }}
              >
                <Icon className="text-white" size={16} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-[15px] font-medium">{item.title}</p>
                <p className="text-[#7f91a4] text-xs">{item.sub}</p>
              </div>
              <FaChevronRight className="text-[#4a5c6e]" size={12} />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="w-full flex items-center gap-4 px-4 py-3 bg-[#17212b] rounded-2xl hover:bg-[#1c2733]"
        >
          <div className="w-10 h-10 rounded-full bg-[#e05a5a] flex items-center justify-center">
            <FaSignOutAlt className="text-white" size={16} />
          </div>
          <span className="text-white text-[15px] font-medium flex-1 text-left">Log Out</span>
        </button>
      </div>
    </div>
  );
      }
