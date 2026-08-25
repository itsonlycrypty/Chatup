'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaHeart, FaUsers, FaPlus, FaClock, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Admin user (your username)
const ADMIN_USERNAME = 'crypty';

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
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email);
      setUsername(user.username || user.email.split('@')[0]);
      setBio(user.bio || '');
      setPhotoURL(user.photoURL || '');
      setFollowers(user.followers || []);
      setFollowing(user.following || []);

      // Check if this is the admin user
      if (user.username === ADMIN_USERNAME) {
        setIsVerified(true);
        setIsAdmin(true);
      }

      const allPosts = JSON.parse(localStorage.getItem('chatup_posts') || '[]');
      const myPosts = allPosts.filter((p: any) => p.userId === user.id);
      setUserPosts(myPosts);

      const allStories = JSON.parse(localStorage.getItem('chatup_stories') || '[]');
      const now = new Date().getTime();
      const validStories = allStories.filter((s: any) => 
        s.userId === user.id && new Date(s.expiresAt).getTime() > now
      );
      setUserStories(validStories);

      let likes = 0;
      myPosts.forEach((p: any) => likes += (p.likes || 0));
      setTotalLikes(likes);
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;
    const users = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    const index = users.findIndex((u: any) => u.id === user.id);
    if (index !== -1) {
      users[index].displayName = displayName;
      users[index].username = username;
      users[index].bio = bio;
      users[index].photoURL = photoURL;
      localStorage.setItem('chatup_users', JSON.stringify(users));
      const updatedUser = { ...user, displayName, username, bio, photoURL };
      localStorage.setItem('chatup_user', JSON.stringify(updatedUser));
      updateUser(updatedUser);
    }
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoURL(result);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-center text-white mb-8">Chat Up</h1>
          <div className="relative mb-4">
            <FaCamera className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full bg-gray-700/50 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <FaClock className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full bg-gray-700/50 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isLogin ? "4-digit PIN" : "Create 4-digit PIN"}
              type={showPin ? 'text' : 'password'}
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 4) setPin(val);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPin ? <FaTimes /> : <FaCamera />}
            </button>
          </div>
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
          <p className="text-gray-500 text-center text-xs mt-4">4-digit PIN • Stored locally</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-gray-900 to-black p-6">
        <div className="flex flex-col items-center relative">
          <div className="relative">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden cursor-pointer border-4 border-blue-500 hover:opacity-80 transition"
            >
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
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
                <h2 className={`text-xl font-bold ${isAdmin ? 'text-yellow-400' : 'text-white'}`}>
                  {displayName}
                  {isVerified && (
                    <span className="ml-1 text-blue-500" title="Verified">
                      <FaCheckCircle className="inline" size={18} />
                    </span>
                  )}
                  {isAdmin && (
                    <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                      Admin
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

      {userStories.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex-shrink-0 bg-blue-600 rounded-full p-1.5">
              <FaClock className="text-white" />
            </div>
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
        <div className="border-t border-gray-800 pt-4">
          <div className="flex justify-between items-center px-2 mb-3">
            <h3 className="text-white font-semibold">Your Videos</h3>
            <button onClick={() => router.push('/upload')} className="text-blue-400 text-sm">
              <FaPlus className="inline mr-1" /> New
            </button>
          </div>
          {userPosts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No posts yet. Tap + to upload!</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post) => (
                <div key={post.id} className="relative aspect-square bg-gray-800 rounded overflow-hidden group">
                  {post.media?.startsWith('data:image') ? (
                    <Image
                      src={post.media}
                      alt="Post"
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <video
                      src={post.media}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <FaHeart className="text-red-400" size={10} />
                    {post.likes || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-center text-xs mt-6">Data stored locally on your device</p>
    </div>
  );
    }
