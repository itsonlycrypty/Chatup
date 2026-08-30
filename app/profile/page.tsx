'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaPlus, FaClock, FaCheckCircle, FaCog, FaBell, FaTrash
} from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData, saveData } from '@/lib/db';

// ... (types for settings, same as before)

export default function Profile() {
  const { user, loading, loginWithPhone, requestVerification, loginWithEmail, logout, updateUser } = useAuth();
  const router = useRouter();
  // ... (state for profile: displayName, username, bio, photoURL, etc.)
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPrivacy, setStoryPrivacy] = useState('everyone');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({ stories: 'everyone', posts: 'everyone' });

  // Load notifications
  useEffect(() => {
    const loadNotifs = async () => {
      const data = await fetchData();
      const notifs = data.notifications || [];
      setNotifications(notifs.filter((n: any) => n.userId === user?.id));
    };
    if (user) loadNotifs();
  }, [user]);

  // ... (loadUserData, handlePhotoUpload – but now photo upload is only via edit modal)

  // Story upload handler
  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const data = await fetchData();
      const stories = data.stories || [];
      const newStory = {
        id: `story_${Date.now()}`,
        media: dataUrl,
        userId: user.id,
        privacy: storyPrivacy, // everyone, friends, selected, nobody
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      stories.push(newStory);
      await saveData({ ...data, stories });
      alert('Story uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Save edit
  const saveEdit = async () => {
    await updateUser({ ...user, ...editData });
    setShowEdit(false);
  };

  // Notification mark as read
  const markAsRead = async (notifId: string) => {
    const data = await fetchData();
    const notifs = data.notifications || [];
    const idx = notifs.findIndex((n: any) => n.id === notifId);
    if (idx !== -1) {
      notifs[idx].read = true;
      await saveData({ ...data, notifications: notifs });
      setNotifications(notifs.filter((n: any) => n.userId === user.id));
    }
  };

  // ... (render login screen with phone input, verification code input, optional email+pin)

  // If logged in:
  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] pb-24">
        {/* Header with notification bell */}
        <div className="flex justify-between items-center p-4 bg-[var(--bg)] z-10 sticky top-0 border-b border-[var(--border)]">
          <h1 className="text-2xl font-bold text-[var(--text)]">Profile</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-[var(--text)] hover:text-blue-400 transition relative"
            >
              <FaBell size={22} />
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </button>
            <button onClick={() => setShowSettings(true)} className="text-[var(--text)] hover:text-blue-400 transition">
              <FaCog size={22} />
            </button>
          </div>
        </div>

        {/* Profile picture – click to upload story */}
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div
              onClick={() => document.getElementById('storyInput')?.click()}
              className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
            >
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <input
              id="storyInput"
              type="file"
              accept="image/*,video/*"
              onChange={handleStoryUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">Tap to add story (expires 24h)</p>
            {/* Story privacy selector */}
            <div className="mt-2 flex gap-2 text-xs">
              <button
                onClick={() => setStoryPrivacy('everyone')}
                className={`px-2 py-1 rounded-full ${storyPrivacy === 'everyone' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Everyone
              </button>
              <button
                onClick={() => setStoryPrivacy('friends')}
                className={`px-2 py-1 rounded-full ${storyPrivacy === 'friends' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Friends
              </button>
              <button
                onClick={() => setStoryPrivacy('selected')}
                className={`px-2 py-1 rounded-full ${storyPrivacy === 'selected' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Selected
              </button>
              <button
                onClick={() => setStoryPrivacy('nobody')}
                className={`px-2 py-1 rounded-full ${storyPrivacy === 'nobody' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                Nobody
              </button>
            </div>
          </div>

          {/* Profile info */}
          <div className="text-center mt-3">
            <h2 className={`text-xl font-bold text-[var(--text)]`}>
              {user?.displayName}
              {user?.isVerified && <span className="ml-1 text-blue-500"><FaCheckCircle className="inline" size={18} /></span>}
            </h2>
            <p className="text-gray-400 text-sm">@{user?.username}</p>
            {user?.bio && <p className="text-gray-300 text-sm mt-1">{user.bio}</p>}
            <button
              onClick={() => setShowEdit(true)}
              className="text-blue-400 text-xs mt-2 hover:text-blue-300"
            >
              <FaEdit className="inline mr-1" /> Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 justify-center">
            <div>
              <p className="text-[var(--text)] font-bold">{user?.following?.length || 0}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{user?.followers?.length || 0}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{user?.totalLikes || 0}</p>
              <p className="text-gray-400 text-xs">Likes</p>
            </div>
          </div>

          <button onClick={logout} className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm transition mx-auto">
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Stories preview */}
        {userStories.length > 0 && (
          <div className="px-4 mt-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <div className="flex-shrink-0 bg-blue-600 rounded-full p-1.5"><FaClock className="text-white" /></div>
              {userStories.map((story) => (
                <div key={story.id} className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-blue-500">
                  {story.media.startsWith('data:image') ? (
                    <Image src={story.media} alt="Story" width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <video src={story.media} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts grid */}
        <div className="px-2 mt-2">
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex justify-between items-center px-2 mb-3">
              <h3 className="text-[var(--text)] font-semibold">Your Posts</h3>
              <button onClick={() => router.push('/upload')} className="text-blue-400 text-sm"><FaPlus className="inline mr-1" /> New</button>
            </div>
            {/* ... posts grid ... */}
          </div>
        </div>

        <FloatingPlusButton />
      </div>

      {/* Full‑screen Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
            <button onClick={() => setShowEdit(false)} className="text-white hover:text-gray-300 mr-4">
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Edit Profile</h2>
            <button onClick={saveEdit} className="ml-auto bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Save</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Profile picture upload */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
                {editData.photoURL || user.photoURL ? (
                  <Image src={editData.photoURL || user.photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                    {editData.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer border-2 border-black">
                  <FaCamera className="text-white text-xs" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditData({ ...editData, photoURL: ev.target?.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Display Name"
              value={editData.displayName || user.displayName || ''}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Username"
              value={editData.username || user.username || ''}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            />
            <textarea
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Bio"
              rows={3}
              value={editData.bio || user.bio || ''}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Email (optional)"
              value={editData.email || user.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="4-digit PIN (optional)"
              type="password"
              maxLength={4}
              value={editData.pin || user.pin || ''}
              onChange={(e) => setEditData({ ...editData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Phone Number"
              value={editData.phone || user.phone || ''}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-semibold mb-2">Privacy</h3>
              <div className="flex justify-between items-center">
                <span className="text-white">Story Visibility</span>
                <select
                  className="bg-gray-700 text-white rounded p-1"
                  value={editData.privacy?.stories || user?.privacy?.stories || 'everyone'}
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
                  value={editData.privacy?.posts || user?.privacy?.posts || 'everyone'}
                  onChange={(e) => setEditData({ ...editData, privacy: { ...editData.privacy, posts: e.target.value } })}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends</option>
                  <option value="selected">Selected</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>
            {/* Delete Profile */}
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
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center pt-16">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-4">Notifications</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-center">No notifications</p>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className={`border-b border-gray-700 py-3 ${n.read ? 'opacity-60' : ''}`}>
                  <p className="text-white">{n.text}</p>
                  <p className="text-gray-400 text-xs">{new Date(n.timestamp).toLocaleString()}</p>
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id)} className="text-blue-400 text-xs mt-1">Mark as read</button>
                  )}
                </div>
              ))
            )}
            <button onClick={() => setShowNotifications(false)} className="w-full bg-red-600 text-white py-2 rounded-xl mt-4">Close</button>
          </div>
        </div>
      )}
    </>
  );
      }
