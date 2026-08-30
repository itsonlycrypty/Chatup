'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaPlus, FaClock, FaCheckCircle, FaCog, FaArrowLeft, FaBell, FaTrash
} from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData, saveData } from '@/lib/db';

type SettingsKeys =
  | 'darkMode'
  | 'language'
  | 'notificationSounds'
  | 'aiVoice'
  | 'autoPlayVideos'
  | 'autoSaveChats'
  | 'showTypingIndicator'
  | 'messageReadReceipts'
  | 'mediaAutoDownload'
  | 'privacyMode'
  | 'twoFactorAuth'
  | 'biometricLogin'
  | 'screenLock'
  | 'appTheme'
  | 'textSize'
  | 'chatBubbleStyle'
  | 'sendOnEnter'
  | 'offlineMode'
  | 'dataSaver'
  | 'highQualityMedia'
  | 'storyAutoPlay'
  | 'storyMute'
  | 'notificationPreview'
  | 'callNotification'
  | 'groupNotification';

type SettingsType = {
  [K in SettingsKeys]: K extends
    | 'language'
    | 'appTheme'
    | 'textSize'
    | 'chatBubbleStyle'
    | 'notificationPreview'
    | 'callNotification'
    | 'groupNotification'
    ? string
    : boolean;
};

export default function Profile() {
  const { user, loading, loginWithPhone, requestVerification, loginWithEmail, logout, updateUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPrivacy, setStoryPrivacy] = useState('everyone');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false); // ✅ correct state
  const fileRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SettingsType>({
    darkMode: false,
    language: 'English',
    notificationSounds: true,
    aiVoice: true,
    autoPlayVideos: true,
    autoSaveChats: true,
    showTypingIndicator: true,
    messageReadReceipts: true,
    mediaAutoDownload: false,
    privacyMode: false,
    twoFactorAuth: false,
    biometricLogin: false,
    screenLock: false,
    appTheme: 'Dark',
    textSize: 'Medium',
    chatBubbleStyle: 'Rounded',
    sendOnEnter: true,
    offlineMode: false,
    dataSaver: false,
    highQualityMedia: true,
    storyAutoPlay: true,
    storyMute: false,
    notificationPreview: 'Name & Message',
    callNotification: 'Ring & Vibrate',
    groupNotification: 'All Messages',
  });

  useEffect(() => {
    const dark = localStorage.getItem('darkMode') === 'true';
    setSettings((prev) => ({ ...prev, darkMode: dark }));
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const toggleSetting = (key: keyof SettingsType) => {
    setSettings((prev) => {
      const value = prev[key];
      if (typeof value === 'boolean') {
        if (key === 'darkMode') {
          const newMode = !value;
          localStorage.setItem('darkMode', String(newMode));
          document.documentElement.classList.toggle('dark', newMode);
          return { ...prev, [key]: newMode };
        }
        return { ...prev, [key]: !value };
      }
      return prev;
    });
  };

  const loadUserData = async () => {
    if (!user) return;
    setDisplayName(user.displayName || user.email || user.phone);
    setUsername(user.username || user.phone?.slice(-4) || 'user');
    setBio(user.bio || '');
    setPhotoURL(user.photoURL || '');
    setIsAdmin(user.isAdmin || false);
    setIsVerified(user.isVerified || false);
    setFollowers(user.followers || []);
    setFollowing(user.following || []);

    const data = await fetchData();
    const allPosts = data.posts || [];
    const myPosts = allPosts.filter((p: any) => p.userId === user.id);
    setUserPosts(myPosts);
    let likes = 0;
    myPosts.forEach((p: any) => (likes += p.likes || 0));
    setTotalLikes(likes);

    const allStories = data.stories || [];
    const now = new Date().getTime();
    const validStories = allStories.filter(
      (s: any) => s.userId === user.id && new Date(s.expiresAt).getTime() > now
    );
    setUserStories(validStories);

    const notifs = data.notifications || [];
    setNotifications(notifs.filter((n: any) => n.userId === user.id));
  };

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoURL(dataUrl);
      await updateUser({ ...user, photoURL: dataUrl });
    };
    reader.readAsDataURL(file);
  };

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
        privacy: storyPrivacy,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      stories.push(newStory);
      await saveData({ ...data, stories });
      loadUserData();
      alert('Story uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async () => {
    if (isLogin) {
      if (phone) {
        try {
          await requestVerification(phone);
          setShowVerification(true);
        } catch (err: any) {
          setError(err.message);
        }
      } else if (email && pin) {
        try {
          await loginWithEmail(email, pin);
        } catch (err: any) {
          setError(err.message);
        }
      }
    } else {
      if (!phone) return setError('Phone number required');
      try {
        await requestVerification(phone);
        setShowVerification(true);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleVerify = async () => {
    try {
      await loginWithPhone(phone, verificationCode, email || undefined, pin || undefined);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    await updateUser({ ...user, ...editData });
    setShowEdit(false);
    loadUserData();
  };

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-sm bg-[var(--card-bg)] rounded-3xl p-8 border border-[var(--border)]">
          <h1 className="text-4xl font-bold text-center text-[var(--text)] mb-8">Chat Up</h1>
          {!showVerification ? (
            <>
              <div className="relative mb-4">
                <input
                  className="w-full bg-gray-700/50 text-[var(--text)] p-3 rounded-xl"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="relative mb-4">
                <input
                  className="w-full bg-gray-700/50 text-[var(--text)] p-3 rounded-xl"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative mb-4">
                <input
                  className="w-full bg-gray-700/50 text-[var(--text)] p-3 rounded-xl"
                  placeholder={isLogin ? 'PIN (optional)' : 'Create PIN (optional)'}
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    if (v.length <= 4) setPin(v);
                  }}
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-3 text-[var(--text)] text-sm">
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-4 transition"
              >
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>
              <p
                className="text-center text-[var(--text)] cursor-pointer mt-4"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? 'No account? Create one' : 'Already have an account?'}
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-[var(--text)] mb-4">We sent a code to {phone}</p>
              <input
                className="w-full bg-gray-700/50 text-[var(--text)] p-3 rounded-xl mb-4"
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button
                onClick={handleVerify}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl mt-4 transition"
              >
                Verify
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const isCrypty = user.username === 'Onlycrypty' || user.username === 'crypty' || user.email === 'wmax8808@gmail.com';

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] pb-24">
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

        <div className="p-6">
          <div className="flex flex-col items-center">
            <div
              onClick={() => document.getElementById('storyInput')?.click()}
              className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
            >
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                  {displayName?.[0]?.toUpperCase() || 'U'}
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
          </div>

          <div className="text-center mt-3">
            <h2 className={`text-xl font-bold text-[var(--text)]`}>
              {displayName}
              {isVerified && <span className="ml-1 text-blue-500"><FaCheckCircle className="inline" size={18} /></span>}
            </h2>
            <p className="text-gray-400 text-sm">@{username}</p>
            {bio && <p className="text-gray-300 text-sm mt-1">{bio}</p>}
            <button
              onClick={() => setShowEdit(true)}
              className="text-blue-400 text-xs mt-2 hover:text-blue-300"
            >
              <FaEdit className="inline mr-1" /> Edit Profile
            </button>
          </div>

          <div className="flex gap-6 mt-4 justify-center">
            <div>
              <p className="text-[var(--text)] font-bold">{following?.length || 0}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{followers?.length || 0}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div>
              <p className="text-[var(--text)] font-bold">{totalLikes}</p>
              <p className="text-gray-400 text-xs">Likes</p>
            </div>
          </div>

          <button onClick={logout} className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm transition mx-auto">
            <FaSignOutAlt /> Logout
          </button>
        </div>

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

        <div className="px-2 mt-2">
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex justify-between items-center px-2 mb-3">
              <h3 className="text-[var(--text)] font-semibold">Your Posts</h3>
              <button onClick={() => router.push('/upload')} className="text-blue-400 text-sm"><FaPlus className="inline mr-1" /> New</button>
            </div>
            {userPosts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No posts yet. Tap + to upload!</p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-gray-800 rounded overflow-hidden group cursor-pointer"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    {post.media?.startsWith('data:image') ? (
                      <Image src={post.media} alt="Post" fill className="object-cover group-hover:scale-105 transition" />
                    ) : post.media?.startsWith('data:video') ? (
                      <video src={post.media} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs">🌐</div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <FaHeart className="text-red-400" size={10} /> {post.likes || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <FloatingPlusButton />
      </div>

      {/* Edit Modal */}
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
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
                {editData.photoURL || photoURL ? (
                  <Image src={editData.photoURL || photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
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
              value={editData.displayName || displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Username"
              value={editData.username || username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            />
            <textarea
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Bio"
              rows={3}
              value={editData.bio || bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="Email"
              value={editData.email || user.email || ''}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <input
              className="w-full bg-gray-800 text-white p-3 rounded-xl"
              placeholder="4-digit PIN"
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
            <button onClick={() => setShowSettings(false)} className="text-white hover:text-gray-300 mr-4">
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Settings</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* ... all the settings toggles (same as before) ... */}
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-red-600 text-white py-2 rounded-xl mt-4 hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
