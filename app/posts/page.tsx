'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchData, saveData } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaComment, FaShare, FaPlay } from 'react-icons/fa';
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

  // Load shorts from DB
  const loadShorts = async () => {
    const data = await fetchData();
    // Get only youtube_bot posts (shorts)
    const shorts = (data.posts || []).filter((p: any) => p.userId === 'youtube_bot');
    const sorted = shorts.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setPosts(sorted);
  };

  // Fetch more shorts from API
  const fetchShorts = async (token: string | null = null) => {
    try {
      const url = token
        ? `/api/tiktok?pageToken=${encodeURIComponent(token)}`
        : '/api/tiktok';
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
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
        }));

        const existingIds = new Set(posts.map((p) => p.id));
        const uniqueNew = newPosts.filter((p: any) => !existingIds.has(p.id));
        if (uniqueNew.length === 0) {
          setHasMore(false);
          return;
        }

        setPosts((prev) => [...prev, ...uniqueNew]);

        // Save to DB
        const binData = await fetchData();
        let allPosts = binData.posts || [];
        allPosts = allPosts.filter((p: any) => p.userId !== 'youtube_bot');
        const allYtPosts = posts.concat(uniqueNew).filter((p: any) => p.userId === 'youtube_bot');
        await saveData({ ...binData, posts: [...allPosts, ...allYtPosts] });

        setNextPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Initial load
  const initialLoad = async () => {
    setLoading(true);
    await loadShorts();
    if (!hasFetched.current) {
      hasFetched.current = true;
      await fetchShorts(null);
    }
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextPageToken) return;
    setLoadingMore(true);
    await fetchShorts(nextPageToken);
    setLoadingMore(false);
  }, [nextPageToken, hasMore, loadingMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, loading, loadingMore, hasMore]);

  useEffect(() => {
    initialLoad();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <h1 className="text-2xl font-bold text-white p-4 sticky top-0 bg-black z-10">Shorts</h1>
      {error && <p className="text-red-400 text-center p-4">{error}</p>}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-400">No shorts available</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 p-2">
          {posts.map((post) => (
            <div key={post.id} className="w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              {/* Video area with loading overlay */}
              <div className="relative aspect-video bg-black">
                {post.media?.startsWith('http') ? (
                  <VideoEmbed url={post.media} thumbnail={post.thumbnail} />
                ) : post.media?.startsWith('data:video') ? (
                  <video
                    src={post.media}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    poster={post.thumbnail || ''}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No video
                  </div>
                )}
                {/* Loading spinner (will be shown while video buffers) – we handle it inside VideoEmbed */}
              </div>
              {/* Text & actions */}
              <div className="p-3">
                {post.text && <p className="text-white text-sm mb-2">{post.text}</p>}
                <div className="flex items-center gap-4 text-gray-400">
                  <button className="flex items-center gap-1 hover:text-red-500 transition">
                    <FaHeart /> <span>{post.likes || 0}</span>
                  </button>
                  <span className="flex items-center gap-1">
                    <FaComment /> <span>{post.comments?.length || 0}</span>
                  </span>
                  <button className="flex items-center gap-1 hover:text-blue-400 transition">
                    <FaShare />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-blue-500 rounded-full" />
            )}
            {!hasMore && !loadingMore && (
              <p className="text-gray-500 text-xs">No more shorts</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
          }
