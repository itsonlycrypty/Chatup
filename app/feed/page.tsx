'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck,
  FaShare, FaVideo, FaTimes, FaYoutube, FaSync, FaFire, FaClock
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
  const [showSearch, setShowSearch] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'videos'>('users');
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shorts, setShorts] = useState<any[]>([]);
  const hasFetchedTrending = useRef(false);

  // Load posts and fetch fresh trending/shorts on mount
  useEffect(() => {
    loadPosts();
    // Only fetch once per session, but refresh on every visit via refresh button or on mount
    if (!hasFetchedTrending.current) {
      hasFetchedTrending.current = true;
      fetchTrendingAndShorts();
    }
    const interval = setInterval(loadPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async () => {
    const data = await fetchData();
    const sorted = (data.posts || []).sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sorted);
    // Load shorts from data (stored separately or from posts with a "short" flag)
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
    setLoadingTrending(true);
    try {
      // 1. Fetch trending videos (most popular)
      const trendingRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=10&key=${YOUTUBE_API_KEY}&regionCode=US`
      );
      const trendingData = await trendingRes.json();
      if (!trendingRes.ok) throw new Error(trendingData.error?.message || 'Trending fetch failed');

      // 2. Fetch Shorts (search for #shorts)
      const shortsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=shorts&maxResults=10&key=${YOUTUBE_API_KEY}&type=video&videoDuration=short`
      );
      const shortsData = await shortsRes.json();

      const binData = await fetchData();
      let existingPosts = binData.posts || [];
      let existingShorts = binData.shorts || [];

      // Remove old YouTube posts (clear previous trending and shorts)
      existingPosts = existingPosts.filter((p: any) => p.userId !== 'youtube_bot');
      existingShorts = existingShorts.filter((s: any) => s.userId !== 'youtube_bot');

      // Build new trending posts
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

      // Build new shorts
      const newShorts = shortsData.items?.map((item: any) => ({
        id: `short_${item.id.videoId}`,
        text: item.snippet.title,
        media: `https://www.youtube.com/shorts/${item.id.videoId}`,
        userId: 'youtube_bot',
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        type: 'short',
      })) || [];

      const allPosts = [...newTrending, ...existingPosts];
      const allShorts = [...newShorts, ...existingShorts];

      await saveData({ ...binData, posts: allPosts, shorts: allShorts });
      loadPosts();
      console.log(`✅ Refreshed feed: ${newTrending.length} trending, ${newShorts.length} shorts`);
    } catch (err: any) {
      console.error('Failed to refresh feed:', err.message);
    }
    setLoadingTrending(false);
  };

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingAndShorts();
    setRefreshing(false);
  };

  // Like, comment, share, follow (unchanged from previous)
  const like = async (postId: string) => {
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    await saveData({ ...data, posts });
    loadPosts();
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    if (!posts[idx].comments) posts[idx].comments = [];
    posts[idx].comments.push({
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      timestamp: new Date().toISOString(),
    });
    await saveData({ ...data, posts });
    setCommentText({ ...commentText, [postId]: '' });
    loadPosts();
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

  // Search functions (updated to show suggestions)
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
    // Search users locally
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
    setActiveTab('users');
  };

  // Render post card
  const renderPost = (p: any) => {
    const postUser = getUser(p.userId);
    const isFollowingUser = isFollowing(p.userId);
    const isExternal = p.media && p.media.startsWith('http');
    const isYoutube = p.media && p.media.includes('youtube.com');
    const isShort = p.type === 'short';

    return (
      <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden mb-4">
        {/* Header */}
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

        {/* Media */}
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
          <button onClick={() => like(p.id)} className="flex items-center gap-1 hover:text-red-400 transition">
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
              onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)}
            />
            <button onClick={() => addComment(p.id)} className="text-blue-500 hover:text-blue-400">
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

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Chat Up</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loadingTrending}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <FaSync className={refreshing || loadingTrending ? 'animate-spin' : ''} size={20} />
          </button>
          <button onClick={openSearch} className="text-white hover:text-blue-400">
            <FaSearch size={22} />
          </button>
        </div>
      </div>

      {/* Shorts Row (horizontal scroll) */}
      {shorts.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-800">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex-shrink-0 bg-purple-600 rounded-full p-1.5">
              <FaFire className="text-white" />
            </div>
            {shorts.map((short) => (
              <div key={short.id} className="flex-shrink-0 w-32 h-48 rounded-lg bg-gray-800 overflow-hidden relative">
                {short.media && short.media.includes('youtube.com') ? (
                  <div className="w-full h-full">
                    <VideoEmbed url={short.media} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    Short
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded flex items-center gap-1">
                  <FaClock size={8} /> <span>24h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No posts yet. Tap + to upload or refresh.</p>
      ) : (
        <div className="space-y-4 p-2">
          {posts.map(renderPost)}
        </div>
      )}

      <FloatingPlusButton />

      {/* Search Modal - TikTok style with suggestions */}
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

            {/* Suggestions - show while typing */}
            {searchQuery.trim() && !searching && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Suggestions</div>
                {searchResults.length === 0 && searchVideos.length === 0 && (
                  <p className="text-gray-500 text-sm">No results</p>
                )}
                {/* User suggestions */}
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
                {/* Video suggestions */}
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

            {/* Tabs for full results */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  activeTab === 'videos' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                YouTube
              </button>
            </div>

            {searching ? (
              <p className="text-gray-400 text-center">Searching...</p>
            ) : activeTab === 'users' ? (
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
