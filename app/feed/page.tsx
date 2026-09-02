'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaSearch, FaShare, FaTimes, FaSync, FaVideo, FaUser
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchVideos, setSearchVideos] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchActiveTab, setSearchActiveTab] = useState<'users' | 'videos'>('users');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Load existing posts from DB
  const loadData = async () => {
    const data = await fetchData();
    const homePosts = (data.posts || []).filter((p: any) => p.type !== 'short');
    const sortedHome = homePosts.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sortedHome);
  };

  // Fetch videos from API using pageToken
  const fetchVideos = async (token: string | null = null) => {
    setError(null);
    try {
      const url = token
        ? `/api/tiktok?pageToken=${encodeURIComponent(token)}`
        : '/api/tiktok';
      const res = await fetch(url);
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
          thumbnail: item.cover || '',
          userId: 'youtube_bot',
          timestamp: new Date().toISOString(),
          type: 'post',
        }));

        const existingIds = new Set(posts.map((p) => p.id));
        const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));

        if (uniqueNew.length === 0) {
          setHasMore(false);
          return;
        }

        setPosts((prev) => [...prev, ...uniqueNew]);

        const binData = await fetchData();
        let allPosts = binData.posts || [];
        allPosts = allPosts.filter((p: any) => p.userId !== 'youtube_bot');
        const allYtPosts = posts.concat(uniqueNew).filter((p: any) => p.userId === 'youtube_bot');
        const merged = [...allPosts, ...allYtPosts];
        await saveData({ ...binData, posts: merged });

        setNextPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch:', err.message);
      setError(err.message || 'Failed to load videos.');
    }
  };

  // Initial load
  const initialLoad = async () => {
    setLoading(true);
    await loadData();
    if (!hasFetched.current) {
      hasFetched.current = true;
      await fetchVideos(null);
    }
    setLoading(false);
  };

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextPageToken) return;
    setLoadingMore(true);
    await fetchVideos(nextPageToken);
    setLoadingMore(false);
  }, [nextPageToken, hasMore, loadingMore]);

  // IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMore, loading, loadingMore, hasMore]);

  // Auto-refresh and initial load
  useEffect(() => {
    const init = async () => {
      await initialLoad();
    };
    init();

    const handleVisibilityChange = () => {
      if (!document.hidden && !loading && !loadingMore) {
        fetchVideos(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (!document.hidden && !loading && !loadingMore) {
        fetchVideos(null);
      }
    }, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setNextPageToken(null);
    setHasMore(true);
    const binData = await fetchData();
    const userPosts = (binData.posts || []).filter((p: any) => p.userId !== 'youtube_bot');
    await saveData({ ...binData, posts: userPosts });
    setPosts(userPosts);
    await fetchVideos(null);
    setRefreshing(false);
  };

  // Share
  const sharePost = async (post: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.text || 'Check out this video on Chat Up',
          text: post.text || 'Check out this video on Chat Up',
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

  // Search
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

  // Render post without likes/comments
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
                {p.userId === 'youtube_bot' ? 'Chat Up Videos' : (postUser?.displayName || 'Unknown')}
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

        <div className="w-full bg-black relative">
          {p.media && p.media.startsWith('data:image') && (
            <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
          )}
          {p.media && p.media.startsWith('data:video') && (
            <video
              src={p.media}
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto object-cover"
              poster={p.thumbnail || ''}
            />
          )}
          {p.media && p.media.startsWith('http') && !p.media.startsWith('data:') && (
            <VideoEmbed url={p.media} thumbnail={p.thumbnail} />
          )}
        </div>

        {p.text && <div className="px-3 py-2 text-sm text-gray-900 dark:text-white">{p.text}</div>}

        {/* Only share button */}
        <div className="flex items-center gap-4 px-3 py-2 text-gray-600 dark:text-gray-400">
          <button onClick={() => sharePost(p)} className="flex items-center gap-1 hover:text-blue-500 transition">
            <FaShare /> Share
          </button>
        </div>
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
            disabled={refreshing || loading || loadingMore}
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
            <button onClick={() => fetchVideos(null)} className="bg-blue-600 px-6 py-2 rounded-full text-white">Retry</button>
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
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-blue-500 rounded-full" />
            )}
            {!hasMore && !loadingMore && (
              <p className="text-xs text-gray-400 dark:text-gray-500">No more videos</p>
            )}
          </div>
        </div>
      )}

      <FloatingPlusButton />

      {/* Search Modal – unchanged */}
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
