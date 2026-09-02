'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchData, saveData } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaComment, FaShare } from 'react-icons/fa';
import VideoEmbed from '@/components/VideoEmbed';

export default function Posts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Load user posts + shorts from DB
  const loadUserPosts = async () => {
    const data = await fetchData();
    // Include both user posts and shorts from youtube_bot
    const allPosts = (data.posts || []).filter(
      (p: any) => p.type !== 'short' // Keep all types except 'short' (if you have that label)
    );
    // Sort by timestamp
    const sorted = allPosts.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sorted);
  };

  // Fetch shorts from TikTok/YouTube API
  const fetchShorts = async (token: string | null = null) => {
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
          likes: 0,
          comments: [],
          timestamp: new Date().toISOString(),
          type: 'post', // keep as post type
        }));

        // Deduplicate against existing posts
        const existingIds = new Set(posts.map((p) => p.id));
        const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));

        if (uniqueNew.length === 0) {
          setHasMore(false);
          return;
        }

        // Append to local state
        setPosts((prev) => [...prev, ...uniqueNew]);

        // Save to DB (merge with existing posts)
        const binData = await fetchData();
        let allPosts = binData.posts || [];
        // Remove existing youtube_bot posts to avoid duplicates
        allPosts = allPosts.filter((p: any) => p.userId !== 'youtube_bot');
        // Add all current youtube posts
        const allYtPosts = posts.concat(uniqueNew).filter((p: any) => p.userId === 'youtube_bot');
        const merged = [...allPosts, ...allYtPosts];
        await saveData({ ...binData, posts: merged });

        setNextPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch shorts:', err.message);
      setError(err.message || 'Failed to load shorts.');
    }
  };

  // Initial load
  const initialLoad = async () => {
    setLoading(true);
    await loadUserPosts();
    if (!hasFetched.current) {
      hasFetched.current = true;
      await fetchShorts(null);
    }
    setLoading(false);
  };

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextPageToken) return;
    setLoadingMore(true);
    await fetchShorts(nextPageToken);
    setLoadingMore(false);
  }, [nextPageToken, hasMore, loadingMore]);

  // IntersectionObserver for infinite scroll
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

  // Initial load on mount
  useEffect(() => {
    initialLoad();
  }, []);

  // Like function (if you want to keep likes)
  const like = async (postId: string) => {
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    await saveData({ ...data, posts });
    // Update local state
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shorts & Posts</h1>

      {error ? (
        <div className="text-center text-red-400">Error: {error}</div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 text-xl">No content yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={post.userId === 'youtube_bot' ? `#` : `/post/${post.id}`}
              className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded overflow-hidden group"
            >
              {post.media?.startsWith('data:image') ? (
                <Image src={post.media} alt="Post" fill className="object-cover group-hover:scale-105 transition" />
              ) : post.media?.startsWith('data:video') ? (
                <video
                  src={post.media}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : post.media?.startsWith('http') ? (
                <div className="relative w-full h-full">
                  <VideoEmbed url={post.media} thumbnail={post.thumbnail} />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs">🌐</div>
              )}
              {/* Like count (optional) */}
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                <FaHeart className="text-red-400" size={10} /> {post.likes || 0}
              </div>
              {/* Optional: comment count */}
              {(post.comments?.length || 0) > 0 && (
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <FaComment size={10} /> {post.comments.length}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {loadingMore && (
          <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-blue-500 rounded-full" />
        )}
        {!hasMore && !loadingMore && posts.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">No more shorts</p>
        )}
      </div>
    </div>
  );
    }
