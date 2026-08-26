'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck,
  FaShare, FaTimes, FaSync, FaUserCircle
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import VideoEmbed from '@/components/VideoEmbed';

export default function Feed() {
  const { user, allUsers, followUser } = useAuth();
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const hasFetched = useRef(false);

  const loadShortsFromDB = async () => {
    const data = await fetchData();
    const allShorts = (data.shorts || []).filter((s: any) =>
      new Date(s.expiresAt).getTime() > new Date().getTime() && s.userId !== 'youtube_bot'
    );
    setShorts(allShorts);
  };

  const fetchTikTokVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tiktok');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const items = data.data.map((item: any) => ({
          id: `tt_${item.id}`,
          text: item.title || item.desc || '',
          media: item.video || item.play || '',
          userId: 'tiktok_bot',
          likes: 0,
          comments: [],
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));
        setShorts(items);
        const binData = await fetchData();
        let existingShorts = binData.shorts || [];
        existingShorts = existingShorts.filter((s: any) => s.userId !== 'tiktok_bot');
        const allShorts = [...items, ...existingShorts];
        await saveData({ ...binData, shorts: allShorts });
      } else {
        setError('No videos found.');
      }
    } catch (err: any) {
      console.error('TikTok fetch error:', err);
      setError('Failed to load TikTok videos.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadShortsFromDB();
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTikTokVideos();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTikTokVideos();
    setRefreshing(false);
  };

  const like = async (shortId: string) => {
    const data = await fetchData();
    const shorts = data.shorts || [];
    const idx = shorts.findIndex((s: any) => s.id === shortId);
    if (idx === -1) return;
    shorts[idx].likes = (shorts[idx].likes || 0) + 1;
    await saveData({ ...data, shorts });
    loadShortsFromDB();
    setShorts(prev => prev.map(s => s.id === shortId ? { ...s, likes: s.likes + 1 } : s));
  };

  const addComment = async (shortId: string) => {
    const text = commentText[shortId]?.trim();
    if (!text || !user) return;
    const data = await fetchData();
    const shorts = data.shorts || [];
    const idx = shorts.findIndex((s: any) => s.id === shortId);
    if (idx === -1) return;
    if (!shorts[idx].comments) shorts[idx].comments = [];
    shorts[idx].comments.push({
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      timestamp: new Date().toISOString(),
    });
    await saveData({ ...data, shorts });
    setCommentText({ ...commentText, [shortId]: '' });
    loadShortsFromDB();
  };

  const sharePost = async (post: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.text || 'Check out this video',
          text: post.text || 'Check out this video',
          url: post.media || window.location.href,
        });
      } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard?.writeText(`${post.text || 'Check out this video'} - ${post.media || ''}`);
      alert('Link copied to clipboard!');
    }
  };

  const getUser = (userId: string) => allUsers.find((u: any) => u.id === userId);
  const isFollowing = (userId: string) => {
    if (!user) return false;
    return user.following?.includes(userId) || false;
  };

  const performSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const data = await fetchData();
    const users = data.users || [];
    const filteredUsers = users.filter((u: any) =>
      u.username?.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filteredUsers);
    setSearching(false);
  };

  const openSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderShort = (s: any) => {
    const postUser = getUser(s.userId);
    const isFollowingUser = isFollowing(s.userId);
    const displayName = s.userId === 'tiktok_bot' ? 'TikTok' : (postUser?.displayName || 'Unknown');

    return (
      <div key={s.id} className="relative h-screen w-full bg-black snap-start snap-always">
        <div className="absolute inset-0">
          <VideoEmbed url={s.media} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        <div className="absolute bottom-28 left-4 right-20 z-10">
          <Link href={s.userId === 'tiktok_bot' ? '#' : `/profile/${s.userId}`} className="flex items-center gap-2">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <FaUserCircle size={32} className="text-white/80" />
            )}
            <span className="text-white font-semibold text-sm">
              {displayName}
              {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
              {postUser?.isVerified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
            </span>
          </Link>
          {user && postUser && postUser.id !== user.id && postUser.id !== 'tiktok_bot' && (
            <button
              onClick={() => followUser(postUser.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowingUser ? 'bg-gray-600/70 text-gray-200' : 'bg-blue-600/80 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
          {s.text && <p className="text-white text-sm mt-1 line-clamp-3">{s.text}</p>}
        </div>

        <div className="absolute bottom-40 right-4 z-10 flex flex-col items-center gap-5">
          <button onClick={() => like(s.id)} className="flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaHeart size={24} className="text-red-400" />
            </div>
            <span className="text-xs mt-1">{s.likes || 0}</span>
          </button>

          <button
            onClick={() => window.location.href = `/post/${s.id}`}
            className="flex flex-col items-center text-white"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaComment size={24} />
            </div>
            <span className="text-xs mt-1">{s.comments?.length || 0}</span>
          </button>

          <button onClick={() => sharePost(s)} className="flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaShare size={24} />
            </div>
            <span className="text-xs mt-1">Share</span>
          </button>
        </div>

        {user && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
            <input
              className="flex-1 bg-transparent text-white placeholder-gray-300 p-2 text-sm focus:outline-none"
              placeholder="Add a comment..."
              value={commentText[s.id] || ''}
              onChange={(e) => setCommentText({ ...commentText, [s.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addComment(s.id)}
            />
            <button onClick={() => addComment(s.id)} className="text-blue-400 hover:text-blue-300 p-1">
              <FaPaperPlane size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-between items-center p-4 bg-black z-10 sticky top-0">
        <h1 className="text-2xl font-bold text-white">Chat Up</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <FaSync className={refreshing || loading ? 'animate-spin' : ''} size={20} />
          </button>
          <button onClick={openSearch} className="text-white hover:text-blue-400">
            <FaSearch size={22} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading videos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchTikTokVideos} className="bg-blue-600 px-6 py-2 rounded-full text-white">Retry</button>
          </div>
        </div>
      ) : shorts.length === 0 ? (
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-gray-400">No videos available. Pull to refresh.</p>
        </div>
      ) : (
        <div className="h-[calc(100vh-65px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {shorts.map((s) => renderShort(s))}
        </div>
      )}

      <FloatingPlusButton />

      {showSearch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-white font-bold">Search</h2>
              <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
            </div>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full bg-gray-700 text-white p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
              />
            </div>
            {searching ? (
              <p className="text-gray-400 text-center">Searching...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.length === 0 && searchQuery ? (
                  <p className="text-gray-400 text-center">No users found</p>
                ) : searchResults.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 bg-gray-700 p-3 rounded-xl hover:bg-gray-600 transition">
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                        {u.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">{u.displayName || u.email}</p>
                      <p className="text-gray-400 text-xs">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
    }
