'use client';
import { useState, useEffect } from 'react';
import { fetchData } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';

export default function Gallery() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      // Only user-uploaded posts (not from youtube_bot, not shorts)
      const allPosts = (data.posts || []).filter(
        (p: any) => p.type !== 'short' && p.userId !== 'youtube_bot'
      );
      setPosts(allPosts);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[var(--bg)]"><div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gallery</h1>
      {posts.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 text-xl">No Videos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded overflow-hidden group">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
        }
