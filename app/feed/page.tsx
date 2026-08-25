'use client';
import { useState, useEffect } from 'react';
import { FaHeart, FaPlus } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const loadData = () => {
    const postsData = JSON.parse(localStorage.getItem('chatup_posts') || '[]');
    const usersData = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    setPosts(postsData);
    setUsers(usersData);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const like = (id: string) => {
    const updated = posts.map(p =>
      p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p
    );
    localStorage.setItem('chatup_posts', JSON.stringify(updated));
    setPosts(updated);
  };

  const getUser = (userId: string) => users.find((u: any) => u.id === userId);

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        <button
          onClick={() => router.push('/upload')}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
        >
          <FaPlus />
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No posts yet. Tap + to upload!</p>
      ) : (
        <div className="space-y-4 p-2">
          {posts.map((p) => {
            const user = getUser(p.userId);
            return (
              <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {user?.displayName || user?.email || 'Unknown'}
                      {user?.isAdmin && (
                        <span className="ml-1 text-yellow-400 text-xs">⭐ Admin</span>
                      )}
                    </p>
                    <p className="text-gray-400 text-xs">@{user?.username || ''}</p>
                  </div>
                </div>

                {/* Post Media */}
                {p.media?.startsWith('data:image') ? (
                  <Image
                    src={p.media}
                    alt="Post"
                    width={400}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                ) : p.media?.startsWith('data:video') ? (
                  <video
                    src={p.media}
                    controls
                    className="w-full h-auto object-cover"
                  />
                ) : null}

                {/* Post Caption & Likes */}
                <div className="p-3">
                  <p className="text-white text-sm">{p.text}</p>
                  <button
                    onClick={() => like(p.id)}
                    className="flex items-center gap-2 mt-3 text-red-400 hover:text-red-300 transition"
                  >
                    <FaHeart /> {p.likes || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
