'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCamera, FaTimes, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';

export default function Settings() {
  const { user, loading, updateUser, logout } = useAuth(); // ✅ added logout
  const router = useRouter();

  const [editData, setEditData] = useState<any>({});
  const [loadingSave, setLoadingSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        phone: user.phone || '',
        email: user.email || '',
        pin: user.pin || '',
        photoURL: user.photoURL || '',
        chatBackground: user.chatBackground || '',
        chatBackgroundPreview: user.chatBackground || '',
        privacy: user.privacy || { stories: 'everyone', posts: 'everyone' },
      });
    }
  }, [user]);

  const saveEdit = async () => {
    setLoadingSave(true);
    try {
      const data = await fetchData();
      const users = data.users || [];
      const existing = users.find((u: any) => u.username === editData.username && u.id !== user.id);
      if (existing) {
        alert('Username already taken. Please choose another.');
        setLoadingSave(false);
        return;
      }
      await updateUser({ ...user, ...editData });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Error updating profile.');
    }
    setLoadingSave(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditData({ ...editData, photoURL: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditData({ ...editData, chatBackground: dataUrl, chatBackgroundPreview: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBg = () => {
    setEditData({ ...editData, chatBackground: '', chatBackgroundPreview: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <div className="flex items-center justify-between p-4 bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        </div>
        <button
          onClick={saveEdit}
          disabled={loadingSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm disabled:opacity-50"
        >
          {loadingSave ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
            {editData.photoURL ? (
              <Image src={editData.photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                {editData.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer border-2 border-black">
              <FaCamera className="text-white text-xs" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <p className="text-gray-500 text-xs mt-1">Tap camera to change photo</p>
        </div>

        {/* Form Fields */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Name</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editData.displayName || ''}
            onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Username</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editData.username || ''}
            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Bio</label>
          <textarea
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={editData.bio || ''}
            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Phone Number</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editData.phone || ''}
            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Email</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editData.email || ''}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm block mb-1">Recovery PIN (4 digits)</label>
          <input
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4-digit PIN"
            type="password"
            maxLength={4}
            value={editData.pin || ''}
            onChange={(e) => setEditData({ ...editData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />
        </div>

        {/* Chat Background */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Chat Background</label>
          <div className="flex items-center gap-2">
            {editData.chatBackgroundPreview ? (
              <div className="w-16 h-16 rounded border border-gray-600 overflow-hidden flex-shrink-0">
                <Image src={editData.chatBackgroundPreview} alt="Bg" width={64} height={64} className="object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded border border-gray-600 flex items-center justify-center text-gray-500 text-xs">None</div>
            )}
            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition">
              Choose Image
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBgChange}
              />
            </label>
            <button
              onClick={removeBg}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-1">Select an image to use as chat background (non‑AI chats)</p>
        </div>

        {/* Privacy Settings */}
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-white font-semibold mb-2">Privacy</h3>
          <div className="flex justify-between items-center">
            <span className="text-white">Story Visibility</span>
            <select
              className="bg-gray-700 text-white rounded p-1"
              value={editData.privacy?.stories || 'everyone'}
              onChange={(e) => setEditData({ ...editData, privacy: { ...editData.privacy, stories: e.target.value } })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends</option>
              <option value="selected">Selected</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-white">Post Visibility</span>
            <select
              className="bg-gray-700 text-white rounded p-1"
              value={editData.privacy?.posts || 'everyone'}
              onChange={(e) => setEditData({ ...editData, privacy: { ...editData.privacy, posts: e.target.value } })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends</option>
              <option value="selected">Selected</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>

        {/* Delete Account */}
        <button
          onClick={async () => {
            if (confirm('Delete your profile permanently? All data will be lost.')) {
              const data = await fetchData();
              const users = data.users || [];
              const idx = users.findIndex((u: any) => u.id === user.id);
              if (idx !== -1) {
                users.splice(idx, 1);
                await saveData({ ...data, users });
                logout();
                router.push('/');
              }
            }
          }}
          className="w-full bg-red-600 text-white py-2 rounded-xl mt-4 hover:bg-red-700 transition"
        >
          <FaTrash className="inline mr-2" /> Delete Profile
        </button>
      </div>
    </div>
  );
        }
