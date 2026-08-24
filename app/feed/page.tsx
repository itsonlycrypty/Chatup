'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import Image from 'next/image';

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
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)));
    });
  }, []);

  const handleLike = async (id: string) => {
    await updateDoc(doc(db, 'posts', id), { likes: increment(1) });
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">📱 Feed</h1>
      {posts.length === 0 && <p className="text-gray-400">No posts yet. Upload one!</p>}
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-900 rounded-xl mb-6 overflow-hidden">
          {post.imageURL && (
            <Image src={post.imageURL} alt="post" width={400} height={400} className="w-full h-64 object-cover" />
          )}
          {post.videoURL && (
            <video src={post.videoURL} controls className="w-full h-64 object-cover" />
          )}
          <div className="p-3">
            <p className="text-sm">{post.text}</p>
            <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 mt-2 text-red-400">
              ❤️ {post.likes || 0}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
          }
