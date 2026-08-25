'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import Image from 'next/image';
import { FaHeart } from 'react-icons/fa';

interface Post {
  id: string;
  text: string;
  imageURL?: string;
  videoURL?: string;
  likes: number;
  userId: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
    });
  }, []);

  const handleLike = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'posts', id), { likes: increment(1) });
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Feed</h1>
      {posts.length === 0 && <p className="text-gray-400 text-center mt-10">No posts yet. Upload one!</p>}
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-800 rounded-2xl mb-6 overflow-hidden shadow-lg">
          {post.imageURL && (
            <Image src={post.imageURL} alt="post" width={400} height={400} className="w-full h-64 object-cover" />
          )}
          {post.videoURL && (
            <video src={post.videoURL} controls className="w-full h-64 object-cover" />
          )}
          <div className="p-4">
            <p className="text-white text-sm">{post.text}</p>
            <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 mt-3 text-red-400 hover:text-red-300 transition">
              <FaHeart size={18} /> <span>{post.likes || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
    }
