'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaHeart } from 'react-icons/fa';
import Image from 'next/image';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLike = async (id: string) => {
    await fetch('/api/posts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'like' }),
    });
    fetchPosts();
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Feed</h1>
      {posts.length === 0 && <p className="text-gray-400 text-center">No posts yet</p>}
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-800 rounded-2xl mb-6 overflow-hidden">
          {post.imageURL && (
            <Image src={post.imageURL} alt="post" width={400} height={400} className="w-full h-64 object-cover" />
          )}
          <div className="p-4">
            <p className="text-white text-sm">{post.text}</p>
            <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 mt-3 text-red-400">
              <FaHeart /> {post.likes || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
              }
