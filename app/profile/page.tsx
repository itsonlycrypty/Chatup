'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FaCamera, FaSignOutAlt, FaHeart, FaPlus, FaClock, FaCheckCircle, FaBell
} from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { fetchData, saveData } from '@/lib/db';

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // ---- Profile state ----
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ---- Load user data ----
  const loadUserData = async () => {
    if (!user) return;
    setDisplayName(user.displayName || user.email || user.phone);
    setUsername(user.username || user.phone?.slice(-4) || 'user');
    setBio(user.bio || '');
    setPhotoURL(user.photoURL || '');
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

  // ---- Story upload ----
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
        privacy: user.privacy?.stories || 'everyone',
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login (profile page will show login form – keep the existing login logic)
    // Since we're removing the login form from profile, we redirect to a login page?
    // Instead, we can keep the login form inline as before.
    // For simplicity, I'll keep the login form from the previous version – you can copy it from your old profile page.
    // But to avoid duplication, we'll redirect to a separate login page if needed.
    // For now, I'll just return a message.
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <p className="text-[var(--text)]">Please log in.</p>
      </div>
    );
  }

  // ---- LOGGED IN ----
  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] pb-24">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-[var(--bg)] sticky top-0 border-b border-[var(--border)] z-10">
          <h1 className="text-2xl font-bold text-[var(--text)]">Profile</h1>
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
        </div>

        <div className="p-6">
          {/* Avatar with story upload */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => document.getElementById('storyInput')?.click()}
              className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition relative"
            >
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                  {displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black">
                <FaPlus size={12} className="text-white" />
              </div>
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
            <h2 className="text-xl font-bold text-[var(--text)]">
              {displayName}
              {isVerified && <span className="ml-1 text-blue-500"><FaCheckCircle className="inline" size={18} /></span>}
            </h2>
            <p className="text-gray-400 text-sm">@{username}</p>
            {bio && <p className="text-gray-300 text-sm mt-1">{bio}</p>}
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

        {/* Stories */}
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

        {/* Posts Grid */}
        <div className="px-2 mt-2">
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex justify-between items-center px-2 mb-3">
              <h3 className="text-[var(--text)] font-semibold">Your Posts</h3>
              <button onClick={() => router.push('/upload')} className="text-blue-400 text-sm">
                <FaPlus className="inline mr-1" /> New
              </button>
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
