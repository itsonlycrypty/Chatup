'use client';
import { useState, useEffect } from 'react';
import { FaHeart, FaSearch } from 'react-icons/fa';
import Image from 'next/image';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import SearchModal from '@/components/SearchModal';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const like = async (id: string) => {
    try {
      await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadPosts();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        <button onClick={() => setShowSearch(true)} className="text-white hover:text-blue-400">
          <FaSearch size={24} />
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No posts yet. Tap + to upload!</p>
      ) : (
        <div className="space-y-4 p-2">
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden">
              {p.media && p.media.startsWith('data:image') && (
                <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
              )}
              {p.media && p.media.startsWith('data:video') && (
                <video src={p.media} controls className="w-full h-auto object-cover" />
              )}
              {p.media && p.media.startsWith('http') && (
                <div className="p-4">
                  <p className="text-blue-400 break-all"><a href={p.media} target="_blank" rel="noopener noreferrer">{p.media}</a></p>
                </div>
              )}
              <div className="p-3">
                <p className="text-white text-sm">{p.text}</p>
                <button onClick={() => like(p.id)} className="flex items-center gap-2 mt-3 text-red-400 hover:text-red-300 transition">
                  <FaHeart /> {p.likes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FloatingPlusButton />

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </div>
  );
        }
