'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck,
  FaShare, FaVideo, FaTimes, FaYoutube, FaSync, FaFire, FaClock,
  FaUserCircle
} from 'react-icons/fa';
import Image from 'next/image';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import VideoEmbed from '@/components/VideoEmbed';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export default function Feed() {
  const { user, allUsers, followUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'shorts'>('home');
  const [showSearch, setShowSearch] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchActiveTab, setSearchActiveTab] = useState<'users' | 'videos'>('users');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const loadData = async () => {
    const data = await fetchData();
    const homePosts = (data.posts || []).filter((p: any) => p.type !== 'short');
    const sortedHome = homePosts.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sortedHome);

    const allShorts = (data.shorts || []).filter((s: any) =>
      new Date(s.expiresAt).getTime() > new Date().getTime()
    );
    setShorts(allShorts);
  };

  const fetchTrendingAndShorts = async () => {
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API key missing');
      return;
    }
    setLoading(true);
    try {
      const trendingRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=10&key=${YOUTUBE_API_KEY}&regionCode=US`
      );
      const trendingData = await trendingRes.json();
      if (!trendingRes.ok) throw new Error(trendingData.error?.message || 'Trending fetch failed');

      const shortsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=shorts&maxResults=10&key=${YOUTUBE_API_KEY}&type=video&videoDuration=short`
      );
      const shortsData = await shortsRes.json();

      const binData = await fetchData();
      let existingPosts = binData.posts || [];
      let existingShorts = binData.shorts || [];

      existingPosts = existingPosts.filter((p: any) => p.userId !== 'youtube_bot');
      existingShorts = existingShorts.filter((s: any) => s.userId !== 'youtube_bot');

      const newTrending = trendingData.items?.map((item: any) => ({
        id: `yt_${item.id}`,
        text: item.snippet.title,
        media: `https://www.youtube.com/watch?v=${item.id}`,
        userId: 'youtube_bot',
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        type: 'post',
      })) || [];

      const newShorts = shortsData.items?.map((item: any) => ({
        id: `short_${item.id.videoId}`,
        text: item.snippet.title,
        media: `https://www.youtube.com/shorts/${item.id.videoId}`,
        userId: 'youtube_bot',
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'short',
      })) || [];

      const allPosts = [...newTrending, ...existingPosts];
      const allShorts = [...newShorts, ...existingShorts];

      await saveData({ ...binData, posts: allPosts, shorts: allShorts });
      await loadData();
      console.log(`✅ Refreshed: ${newTrending.length} trending, ${newShorts.length} shorts`);
    } catch (err: any) {
      console.error('Failed to refresh feed:', err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTrendingAndShorts();
    }
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingAndShorts();
    setRefreshing(false);
  };

  const like = async (postId: string, isShort: boolean = false) => {
    const data = await fetchData();
    const target = isShort ? (data.shorts || []) : (data.posts || []);
    const idx = target.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    target[idx].likes = (target[idx].likes || 0) + 1;
    await saveData({ ...data, posts: data.posts || [], shorts: data.shorts || [] });
    loadData();
  };

  const addComment = async (postId: string, isShort: boolean = false) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const data = await fetchData();
    const target = isShort ? (data.shorts || []) : (data.posts || []);
    const idx = target.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    if (!target[idx].comments) target[idx].comments = [];
    target[idx].comments.push({
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      timestamp: new Date().toISOString(),
    });
    await saveData({ ...data, posts: data.posts || [], shorts: data.shorts || [] });
    setCommentText({ ...commentText, [postId]: '' });
    loadData();
  };

  const sharePost = async (post: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.text || 'Check out this post on Chat Up',
          text: post.text || 'Check out this post on Chat Up',
          url: post.media || window.location.href,
        });
      } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard?.writeText(`${post.text || 'Check out this post'} - ${post.media || ''}`);
      alert('Link copied to clipboard!');
    }
  };

  const getUser = (userId: string) => allUsers.find((u: any) => u.id === userId);
  const isFollowing = (userId: string) => {
    if (!user) return false;
    return user.following?.includes(userId) || false;
  };

  const searchYouTube = async (query: string) => {
    if (!YOUTUBE_API_KEY) return [];
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=10&type=video`
      );
      const data = await res.json();
      if (data.items) {
        return data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.medium.url,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          channel: item.snippet.channelTitle,
        }));
      }
      return [];
    } catch (e) { return []; }
  };

  const performSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchVideos([]);
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
    const videos = await searchYouTube(query);
    setSearchVideos(videos);
    setSearching(false);
  };

  const openSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    setSearchVideos([]);
    setSearchActiveTab('users');
  };

  // ----- Home feed render (unchanged) -----
  const renderPost = (p: any, isShort: boolean = false) => {
    const postUser = getUser(p.userId);
    const isFollowingUser = isFollowing(p.userId);
    const isExternal = p.media && p.media.startsWith('http');
    const isYoutube = p.media && p.media.includes('youtube.com');

    return (
      <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden mb-4">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            ) : p.userId === 'youtube_bot' ? (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm">
                <FaYoutube />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                {postUser?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">
                {p.userId === 'youtube_bot' ? (isShort ? 'YouTube Shorts' : 'YouTube Trending') : (postUser?.displayName || 'Unknown')}
                {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
                {postUser?.isVerified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
                {p.userId === 'youtube_bot' && <span className="ml-1 text-red-500 text-xs">🔥</span>}
                {isShort && <span className="ml-1 text-purple-400 text-xs">#Shorts</span>}
              </p>
              <p className="text-gray-400 text-xs">
                {p.userId === 'youtube_bot' ? (isShort ? 'Shorts' : 'Trending on YouTube') : `@${postUser?.username || ''}`}
              </p>
            </div>
          </div>
          {user && postUser && postUser.id !== user.id && postUser.id !== 'youtube_bot' && (
            <button
              onClick={() => followUser(postUser.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowingUser ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowingUser ? <FaUserCheck className="inline mr-1" /> : <FaUserPlus className="inline mr-1" />}
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {p.media && p.media.startsWith('data:image') && (
          <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
        )}
        {p.media && p.media.startsWith('data:video') && (
          <video src={p.media} controls className="w-full h-auto object-cover" />
        )}
        {p.media && p.media.startsWith('http') && !p.media.startsWith('data:') && (
          <VideoEmbed url={p.media} />
        )}

        {p.text && <div className="px-3 py-1"><p className="text-white text-sm">{p.text}</p></div>}

        <div className="flex items-center gap-6 px-3 py-2 text-gray-400 text-sm">
          <button onClick={() => like(p.id, isShort)} className="flex items-center gap-1 hover:text-red-400 transition">
            <FaHeart className="text-red-400" /> {p.likes || 0}
          </button>
          <span className="flex items-center gap-1">
            <FaComment /> {(p.comments?.length || 0)}
          </span>
          <button onClick={() => sharePost(p)} className="flex items-center gap-1 hover:text-blue-400 transition">
            <FaShare /> Share
          </button>
        </div>

        {(p.comments?.length || 0) > 0 && (
          <div className="px-3 pb-2 space-y-1">
            {p.comments.slice(-3).map((c: any) => (
              <div key={c.id} className="text-sm">
                <span className="text-blue-400 font-semibold">@{c.username}</span>
                <span className="text-gray-300 ml-2">{c.text}</span>
              </div>
            ))}
            {p.comments.length > 3 && <p className="text-gray-500 text-xs">+{p.comments.length - 3} more</p>}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2 p-3 border-t border-gray-800">
            <input
              className="flex-1 bg-gray-800 text-white p-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a comment..."
              value={commentText[p.id] || ''}
              onChange={(e) => setCommentText({ ...commentText, [p.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addComment(p.id, isShort)}
            />
            <button onClick={() => addComment(p.id, isShort)} className="text-blue-500 hover:text-blue-400">
              <FaPaperPlane />
            </button>
          </div>
        )}

        {isExternal && (
          <div className="px-3 pb-2 text-xs text-gray-500 flex items-center gap-1">
            <FaVideo /> {isYoutube ? (isShort ? 'YouTube Short' : 'YouTube') : 'External'} source
          </div>
        )}
      </div>
    );
  };

  // ----- TikTok-style Shorts render -----
  const renderShort = (s: any) => {
    const postUser = getUser(s.userId);
    const isFollowingUser = isFollowing(s.userId);

    return (
      <div key={s.id} className="relative h-screen w-full bg-black snap-start snap-always">
        {/* Video/Media fills the whole screen */}
        <div className="absolute inset-0">
          {s.media && s.media.startsWith('http') ? (
            <VideoEmbed url={s.media} />
          ) : s.media?.startsWith('data:video') ? (
            <video src={s.media} controls className="w-full h-full object-cover" />
          ) : s.media?.startsWith('data:image') ? (
            <Image src={s.media} fill className="object-cover" alt="Short" />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
              No media
            </div>
          )}
        </div>

        {/* Overlay gradient (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* User info & caption at bottom-left */}
        <div className="absolute bottom-28 left-4 right-20 z-10">
          <div className="flex items-center gap-2">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <FaUserCircle size={32} className="text-white/80" />
            )}
            <span className="text-white font-semibold text-sm">
              {postUser?.displayName || 'Unknown'}
              {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
              {postUser?.isVerified && <span className="ml-1 text-blue-400 text-xs">✓</span>}
            </span>
            {user && postUser && postUser.id !== user.id && postUser.id !== 'youtube_bot' && (
              <button
                onClick={() => followUser(postUser.id)}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  isFollowingUser ? 'bg-gray-600/70 text-gray-200' : 'bg-blue-600/80 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowingUser ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          {s.text && <p className="text-white text-sm mt-1 line-clamp-2">{s.text}</p>}
        </div>

        {/* Right-side action buttons */}
        <div className="absolute bottom-40 right-4 z-10 flex flex-col items-center gap-5">
          <button onClick={() => like(s.id, true)} className="flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition">
              <FaHeart size={24} className="text-red-400" />
            </div>
            <span className="text-xs mt-1">{s.likes || 0}</span>
          </button>

          <button
            onClick={() => {
              // Focus comment input – we'll scroll to it or open a modal
              // For simplicity, we just add a comment using the existing input (we'll handle later)
              // Here we'll just simulate by focusing a hidden input or we can open a comment modal.
              // For now, we'll add a comment via prompt (but we'll reuse the global comment system).
              // To keep it simple, we'll use the existing comment state by setting the commentText for this post.
              // The user can comment via the comment input at the bottom of the post (we'll add it).
            }}
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

        {/* Comment input overlay at bottom */}
        {user && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 border border-white/20">
            <input
              className="flex-1 bg-transparent text-white placeholder-gray-300 p-2 text-sm focus:outline-none"
              placeholder="Add a comment..."
              value={commentText[s.id] || ''}
              onChange={(e) => setCommentText({ ...commentText, [s.id]: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addComment(s.id, true)}
            />
            <button onClick={() => addComment(s.id, true)} className="text-blue-400 hover:text-blue-300 p-1">
              <FaPaperPlane size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-black z-10 sticky top-0">
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

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-black sticky top-14 z-10">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            activeTab === 'home' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('shorts')}
          className={`flex-1 py-3 text-sm font-semibold transition ${
            activeTab === 'shorts' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Shorts
        </button>
      </div>

      {/* Content */}
      {activeTab === 'home' ? (
        <>
          {posts.length === 0 ? (
            <p className="text-gray-400 text-center py-20">No posts yet. Tap + to upload or refresh.</p>
          ) : (
            <div className="space-y-4 p-2">
              {posts.map((p) => renderPost(p, false))}
            </div>
          )}
        </>
      ) : (
        <div className="h-[calc(100vh-120px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {shorts.length === 0 ? (
            <p className="text-gray-400 text-center py-20">No shorts available. Refresh to load.</p>
          ) : (
            shorts.map((s) => renderShort(s))
          )}
        </div>
      )}

      <FloatingPlusButton />

      {/* Search Modal (unchanged) */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-white font-bold">Search</h2>
              <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users or videos..."
                className="w-full bg-gray-700 text-white p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
              />
            </div>

            {searchQuery.trim() && !searching && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Suggestions</div>
                {searchResults.length === 0 && searchVideos.length === 0 && (
                  <p className="text-gray-500 text-sm">No results</p>
                )}
                {searchResults.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 bg-gray-700 p-2 rounded-lg mb-1 hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setSearchQuery(u.username);
                      performSearch(u.username);
                    }}
                  >
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="Avatar" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                        {u.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-semibold">{u.displayName || u.email}</p>
                      <p className="text-gray-400 text-xs">@{u.username}</p>
                    </div>
                  </div>
                ))}
                {searchVideos.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 bg-gray-700 p-2 rounded-lg mb-1 hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setSearchQuery(v.title);
                      performSearch(v.title);
                    }}
                  >
                    <img src={v.thumbnail} alt={v.title} className="w-12 h-8 object-cover rounded" />
                    <div>
                      <p className="text-white text-sm truncate">{v.title}</p>
                      <p className="text-gray-400 text-xs">{v.channel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchActiveTab('users')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  searchActiveTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setSearchActiveTab('videos')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  searchActiveTab === 'videos' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                YouTube
              </button>
            </div>

            {searching ? (
              <p className="text-gray-400 text-center">Searching...</p>
            ) : searchActiveTab === 'users' ? (
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
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchVideos.length === 0 && searchQuery ? (
                  <p className="text-gray-400 text-center">No YouTube videos found</p>
                ) : searchVideos.map((v) => (
                  <div
                    key={v.id}
                    className="bg-gray-700 p-3 rounded-xl hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => window.open(v.url, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold truncate">{v.title}</p>
                        <p className="text-gray-400 text-xs">{v.channel}</p>
                      </div>
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
