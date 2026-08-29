'use client';
import { useState, useEffect, useRef } from 'react';
import {
  FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck,
  FaShare, FaTimes, FaSync, FaTrash, FaVideo, FaUser
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
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
  const [searchActiveTab, setSearchActiveTab] = useState<'users' | 'videos'>('users');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const loadData = async () => {
    const data = await fetchData();
    const homePosts = (data.posts || []).filter((p: any) => p.type !== 'short');
    const sortedHome = homePosts.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sortedHome);
  };

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tiktok');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API error');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.data && data.data.length > 0) {
        const newPosts = data.data.map((item: any) => ({
          id: `yt_${item.id}`,
          text: item.title || item.desc || '',
          media: item.video || item.play || '',
          userId: 'youtube_bot',
          likes: 0,
          comments: [],
          timestamp: new Date().toISOString(),
          type: 'post',
        }));
        const binData = await fetchData();
        let existingPosts = binData.posts || [];
        existingPosts = existingPosts.filter((p: any) => p.userId !== 'youtube_bot');
        const allPosts = [...newPosts, ...existingPosts];
        await saveData({ ...binData, posts: allPosts });
        await loadData();
        console.log(`✅ Refreshed feed: ${newPosts.length} videos`);
      } else {
        setError('No videos found.');
      }
    } catch (err: any) {
      console.error('Failed to fetch:', err.message);
      setError(err.message || 'Failed to load videos.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await loadData();
      if (!hasFetched.current) {
        hasFetched.current = true;
        await fetchVideos();
      }
    };
    init();
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchVideos();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(() => {
      if (!document.hidden) fetchVideos();
    }, 5 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const like = async (postId: string) => {
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    await saveData({ ...data, posts });
    loadData();
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
    loadData();
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!user) return;
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    const post = posts[idx];
    if (!post.comments) return;
    const commentIdx = post.comments.findIndex((c: any) => c.id === commentId);
    if (commentIdx === -1) return;
    if (post.comments[commentIdx].userId !== user.id) return;
    post.comments.splice(commentIdx, 1);
    await saveData({ ...data, posts });
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

  // ----- Search -----
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
    // Search users
    const data = await fetchData();
    const users = data.users || [];
    const filteredUsers = users.filter((u: any) =>
      u.username?.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filteredUsers);
    // Search videos
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

  const renderPost = (p: any) => {
    const postUser = getUser(p.userId);
    const isFollowingUser = isFollowing(p.userId);

    return (
      <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-md mb-6 overflow-hidden">
        <div className="flex items-center justify-between p-3">
          <Link href={p.userId === 'youtube_bot' ? '#' : `/profile/${p.userId}`} className="flex items-center gap-3">
            {postUser?.photoURL ? (
              <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            ) : p.userId === 'youtube_bot' ? (
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                CU
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                {postUser?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {p.userId === 'youtube_bot' ? 'Chat Up Shorts' : (postUser?.displayName || 'Unknown')}
                {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
                {postUser?.isVerified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {p.userId === 'youtube_bot' ? 'Trending' : `@${postUser?.username || ''}`}
              </p>
            </div>
          </Link>
          {user && postUser && postUser.id !== user.id && postUser.id !== 'youtube_bot' && (
            <button
              onClick={() => followUser(postUser.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowingUser ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="w-full bg-black">
          {p.media && p.media.startsWith('data:image') && (
            <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
          )}
          {p.media && p.media.startsWith('data:video') && (
            <video src={p.media} controls className="w-full h-auto object-cover" />
          )}
          {p.media && p.media.startsWith('http') && !p.media.startsWith('data:') && (
            <VideoEmbed url={p.media} />
          )}
        </div>

        {p.text && <div className="px-3 py-1 text-sm text-gray-900 dark:text-white">{p.text}</div>}

        <div className="flex items-center gap-6 px-3 py-2 text-gray-600 dark:text-gray-400">
          <button onClick={() => like(p.id)} className="flex items-center gap-1 hover:text-red-500 transition">
            <FaHeart className="text-red-500" /> {p.likes || 0}
          </button>
          <span className="flex items-center gap-1">
            <FaComment /> {(p.comments?.length || 0)}
          </span>
          <button onClick={() => sharePost(p)} className="flex items-center gap-1 hover:text-blue-500 transition">
            <FaShare />
          </button>
        </div>

        {(p.comments?.length || 0) > 0 && (
          <div className="px-3 pb-2 space-y-1">
            {p.comments.slice(-3).map((c: any) => {
              const isOwnComment = user && c.userId === user.id;
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-blue-500 font-semibold">@{c.username}</span>
                    <span className="text-gray-700 dark:text-gray-300 ml-2">{c.text}</span>
                  </div>
                  {isOwnComment && (
                    <button
                      onClick={() => deleteComment(p.id, c.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Delete comment"
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            {p.comments.length > 3 && (
              <p className="text-gray-500 dark:text-gray-400 text-xs">+{p.comments.length - 3} more</p>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
            <input
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Up</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition disabled:opacity-50"
          >
            <FaSync className={refreshing || loading ? 'animate-spin' : ''} size={20} />
          </button>
          <button onClick={openSearch} className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
            <FaSearch size={22} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading videos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="text-red-400 text-5xl mb-4">📹</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={fetchVideos} className="bg-blue-600 px-6 py-2 rounded-full text-white">Retry</button>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="text-gray-400 text-5xl mb-4">📹</div>
            <p className="text-gray-500 dark:text-gray-400">No posts yet. Tap + to upload or refresh.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto p-2">
          {posts.map((p) => renderPost(p))}
        </div>
      )}

      <FloatingPlusButton />

      {/* Full‑screen Search Modal with Users & Videos tabs */}
      {showSearch && (
        <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search</h2>
            <button onClick={() => setShowSearch(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
              <FaTimes size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users or videos..."
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => performSearch(e.target.value)}
                autoFocus
              />
            </div>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchActiveTab('users')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  searchActiveTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FaUser className="inline mr-1" /> Users
              </button>
              <button
                onClick={() => setSearchActiveTab('videos')}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  searchActiveTab === 'videos' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FaVideo className="inline mr-1" /> Videos
              </button>
            </div>
            {/* Suggestions */}
            {searchQuery.trim() && !searching && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggestions</div>
                {searchResults.length === 0 && searchVideos.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No results</p>
                )}
                {searchActiveTab === 'users' && searchResults.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mb-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
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
                      <p className="text-gray-900 dark:text-white text-sm font-semibold">{u.displayName || u.email}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">@{u.username}</p>
                    </div>
                  </div>
                ))}
                {searchActiveTab === 'videos' && searchVideos.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mb-1 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setSearchQuery(v.title);
                      performSearch(v.title);
                    }}
                  >
                    <img src={v.thumbnail} alt={v.title} className="w-12 h-8 object-cover rounded" />
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm truncate">{v.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{v.channel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Full results */}
            {searching ? (
              <p className="text-gray-500 dark:text-gray-400 text-center">Searching...</p>
            ) : searchActiveTab === 'users' ? (
              <div className="space-y-2">
                {searchResults.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    onClick={() => setShowSearch(false)}
                    className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                        {u.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-gray-900 dark:text-white font-semibold">{u.displayName || u.email}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {searchVideos.map((v) => (
                  <div
                    key={v.id}
                    className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                    onClick={() => window.open(v.url, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded" />
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-semibold truncate">{v.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">{v.channel}</p>
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
