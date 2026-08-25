'use client';
import { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import Image from 'next/image';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);

  const loadPosts = () => {
    const data = JSON.parse(localStorage.getItem('chatup_posts') || '[]');
    setPosts(data);
  };

  useEffect(() => { loadPosts(); }, []);

  const like = (id: string) => {
    const updated = posts.map(p =>
      p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    localStorage.setItem('chatup_posts', JSON.stringify(updated));
    setPosts(updated);
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Feed</h1>
      {posts.length === 0 && <p className="text-gray-400 text-center">No posts yet</p>}
      {posts.map(p => (
        <div key={p.id} className="bg-gray-800 rounded-2xl mb-6 overflow-hidden">
          {p.imageURL && <Image src={p.imageURL} alt="post" width={400} height={400} className="w-full h-64 object-cover" />}
          <div className="p-4">
            <p className="text-white">{p.text}</p>
            <button onClick={() => like(p.id)} className="flex items-center gap-2 mt-3 text-red-400">
              <FaHeart /> {p.likes || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
    }
