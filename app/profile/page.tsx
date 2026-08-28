'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FaCamera,
  FaSignOutAlt,
  FaEdit,
  FaCheck,
  FaTimes,
  FaHeart,
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaCog,
  FaArrowLeft,
} from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData } from '@/lib/db';

// Settings keys and type
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
  const { user, loading, login, logout, updateUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
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
  const fileRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [settings, setSettings] = useState<SettingsType>({
    darkMode: true,
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

  const toggleSetting = (key: SettingsKeys) => {
    setSettings((prev) => {
      const value = prev[key];
      if (typeof value === 'boolean') {
        return { ...prev, [key]: !value };
      }
      return prev;
    });
  };

  // Load user data from JSONBin
  const loadUserData = async () => {
    if (!user) return;
    setDisplayName(user.displayName || user.email);
    setUsername(user.username || user.email.split('@')[0]);
    setBio(user.bio || '');
    setPhotoURL(user.photoURL || '');
    setFollowers(user.followers || []);
    setFollowing(user.following || []);
    setIsAdmin(user.isAdmin || false);
    setIsVerified(user.isVerified || false);

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
      (s: any) =>
        s.userId === user.id && new Date(s.expiresAt).getTime() > now
    );
    setUserStories(validStories);
  };

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  // Handle profile picture upload (base64)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      setPhotoURL(dataUrl);
      await updateUser({ userId: user.id, photoURL: dataUrl });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
  };

  const handleSaveProfile = async () => {
    await updateUser({ userId: user.id, displayName, username, bio, photoURL });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }

  // Login / Signup screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            Chat Up
          </h1>
          <input
            className="w-full bg-gray-700/50 text-white p-3 rounded-xl mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full bg-gray-700/50 text-white p-3 rounded-xl mb-4"
            placeholder={isLogin ? '4-digit PIN' : 'Create 4-digit PIN'}
            type={showPin ? 'text' : 'password'}
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length <= 4) setPin(v);
            }}
          />
          <button
            onClick={() => setShowPin(!showPin)}
            className="text-gray-400 text-sm"
          >
            {showPin ? 'Hide PIN' : 'Show PIN'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={async () => {
              try {
                await login(email, pin);
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-4 transition"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
          <p
            className="text-center text-gray-400 cursor-pointer mt-4"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPin('');
            }}
          >
            {isLogin ? 'No account? Create one' : 'Already have an account?'}
          </p>
        </div>
      </div>
    );
  }

  // Profile (logged in)
  return (
    <>
      <div className="min-h-screen bg-black pb-24">
        {/* Header with Settings Gear */}
        <div className="flex justify-between items-center p-4 bg-black z-10 sticky top-0">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white transition"
          >
            <FaCog size={24} />
          </button>
        </div>

        {/* Profile content */}
        <div className="bg-gradient-to-b from-gray-900 to-black p-6">
          <div className="flex flex-col items-center relative">
            <div className="relative">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
              >
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-black"
              >
                <FaCamera className="text-white text-xs" />
              </button>
            </div>

            <div className="mt-3 text-center">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    className="bg-gray-800 text-white px-3 py-1 rounded text-center w-full"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display Name"
                  />
                  <input
                    className="bg-gray-800 text-gray-400 px-3 py-1 rounded text-center w-full text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                  <textarea
                    className="bg-gray-800 text-gray-400 px-3 py-1 rounded text-center w-full text-sm"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-center mt-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-600 text-white px-4 py-1 rounded-full text-sm"
                    >
                      <FaCheck className="inline mr-1" /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-4 py-1 rounded-full text-sm"
                    >
                      <FaTimes className="inline mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2
                    className={`text-xl font-bold ${
                      isAdmin ? 'text-yellow-400' : 'text-white'
                    }`}
                  >
                    {displayName}
                    {isVerified && (
                      <span className="ml-1 text-blue-500" title="Verified">
                        <FaCheckCircle className="inline" size={18} />
                      </span>
                    )}
                    {isAdmin && (
                      <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-400 text-sm">@{username}</p>
                  {bio && <p className="text-gray-300 text-sm mt-1">{bio}</p>}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-400 text-xs mt-2 hover:text-blue-300"
                  >
                    <FaEdit className="inline mr-1" /> Edit Profile
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-6 mt-4 text-center">
              <div>
                <p className="text-white font-bold">{following.length}</p>
                <p className="text-gray-400 text-xs">Following</p>
              </div>
              <div>
                <p className="text-white font-bold">{followers.length}</p>
                <p className="text-gray-400 text-xs">Followers</p>
              </div>
              <div>
                <p className="text-white font-bold">{totalLikes}</p>
                <p className="text-gray-400 text-xs">Likes</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm transition"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* Stories */}
        {userStories.length > 0 && (
          <div className="px-4 mt-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <div className="flex-shrink-0 bg-blue-600 rounded-full p-1.5">
                <FaClock className="text-white" />
              </div>
              {userStories.map((story) => (
                <div
                  key={story.id}
                  className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-blue-500"
                >
                  {story.media.startsWith('data:image') ? (
                    <Image
                      src={story.media}
                      alt="Story"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
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
          <div className="border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center px-2 mb-3">
              <h3 className="text-white font-semibold">Your Posts</h3>
              <button
                onClick={() => router.push('/upload')}
                className="text-blue-400 text-sm"
              >
                <FaPlus className="inline mr-1" /> New
              </button>
            </div>
            {userPosts.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No posts yet. Tap + to upload!
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative aspect-square bg-gray-800 rounded overflow-hidden group cursor-pointer"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    {post.media?.startsWith('data:image') ? (
                      <Image
                        src={post.media}
                        alt="Post"
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    ) : post.media?.startsWith('data:video') ? (
                      <video
                        src={post.media}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs">
                        🌐 Link
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <FaHeart className="text-red-400" size={10} />{' '}
                      {post.likes || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <FloatingPlusButton />
      </div>

      {/* Full‑screen Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
            <button
              onClick={() => setShowSettings(false)}
              className="text-white hover:text-gray-300 mr-4"
            >
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Settings</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* 20+ settings */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Dark Mode</span>
              <button
                onClick={() => toggleSetting('darkMode')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.darkMode ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                {settings.darkMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Language</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Chinese</option>
                <option>Japanese</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Notification Sounds</span>
              <button
                onClick={() => toggleSetting('notificationSounds')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.notificationSounds ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.notificationSounds ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">AI Voice</span>
              <button
                onClick={() => toggleSetting('aiVoice')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.aiVoice ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                {settings.aiVoice ? 'Enable' : 'Disable'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Auto‑Play Videos</span>
              <button
                onClick={() => toggleSetting('autoPlayVideos')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.autoPlayVideos ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.autoPlayVideos ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Auto‑Save Chats</span>
              <button
                onClick={() => toggleSetting('autoSaveChats')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.autoSaveChats ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.autoSaveChats ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Show Typing Indicator</span>
              <button
                onClick={() => toggleSetting('showTypingIndicator')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.showTypingIndicator ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.showTypingIndicator ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Message Read Receipts</span>
              <button
                onClick={() => toggleSetting('messageReadReceipts')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.messageReadReceipts ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.messageReadReceipts ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Media Auto‑Download</span>
              <button
                onClick={() => toggleSetting('mediaAutoDownload')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.mediaAutoDownload ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.mediaAutoDownload ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Privacy Mode</span>
              <button
                onClick={() => toggleSetting('privacyMode')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.privacyMode ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                {settings.privacyMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Two‑Factor Auth</span>
              <button
                onClick={() => toggleSetting('twoFactorAuth')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.twoFactorAuth ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Biometric Login</span>
              <button
                onClick={() => toggleSetting('biometricLogin')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.biometricLogin ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.biometricLogin ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Screen Lock</span>
              <button
                onClick={() => toggleSetting('screenLock')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.screenLock ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.screenLock ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">App Theme</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.appTheme}
                onChange={(e) =>
                  setSettings({ ...settings, appTheme: e.target.value })
                }
              >
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Text Size</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.textSize}
                onChange={(e) =>
                  setSettings({ ...settings, textSize: e.target.value })
                }
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Chat Bubble Style</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.chatBubbleStyle}
                onChange={(e) =>
                  setSettings({ ...settings, chatBubbleStyle: e.target.value })
                }
              >
                <option>Rounded</option>
                <option>Square</option>
                <option>Sharp</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Send on Enter</span>
              <button
                onClick={() => toggleSetting('sendOnEnter')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.sendOnEnter ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.sendOnEnter ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Offline Mode</span>
              <button
                onClick={() => toggleSetting('offlineMode')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.offlineMode ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.offlineMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Data Saver</span>
              <button
                onClick={() => toggleSetting('dataSaver')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.dataSaver ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.dataSaver ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">High Quality Media</span>
              <button
                onClick={() => toggleSetting('highQualityMedia')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.highQualityMedia ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.highQualityMedia ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Story Auto‑Play</span>
              <button
                onClick={() => toggleSetting('storyAutoPlay')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.storyAutoPlay ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.storyAutoPlay ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Story Mute</span>
              <button
                onClick={() => toggleSetting('storyMute')}
                className={`px-4 py-1 rounded-full text-sm ${
                  settings.storyMute ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                {settings.storyMute ? 'Muted' : 'Unmuted'}
              </button>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Notification Preview</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.notificationPreview}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notificationPreview: e.target.value,
                  })
                }
              >
                <option>Name & Message</option>
                <option>Name Only</option>
                <option>None</option>
              </select>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <span className="text-white">Call Notification</span>
              <select
                className="bg-gray-700 text-white rounded p-1"
                value={settings.callNotification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    callNotification: e.target.value,
                  })
                }
              >
                <option>Ring & Vibrate</option>
                <option>Ring Only</option>
                <option>Vibrate Only</option>
                <option>Silent</option>
              </select>
            </div>

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
