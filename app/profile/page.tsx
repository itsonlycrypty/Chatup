'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaCamera, FaEdit, FaCog, FaPlus, FaHeart } from 'react-icons/fa';

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<'posts' | 'archived'>('posts');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchData();
      const myPosts = (data.posts || []).filter((p: any) => p.userId === user.id);
      setPosts(myPosts);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-[#5288c1] rounded-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0e1621] pb-24">
      {/* Top icons */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button className="text-[#7f91a4]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
          </svg>
        </button>
        <button className="text-[#7f91a4]">
          <svg width="4" height="20" viewBox="0 0 4 20" fill="currentColor">
            <circle cx="2" cy="2" r="2" />
            <circle cx="2" cy="10" r="2" />
            <circle cx="2" cy="18" r="2" />
          </svg>
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mt-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-[#232e3c]">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Profile" width={112} height={112} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-white font-bold bg-[#2f6ea8]">
                {(user.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="absolute bottom-1 right-0 w-9 h-9 rounded-full bg-[#5288c1] border-4 border-[#0e1621] flex items-center justify-center"
          >
            <FaCamera size={14} className="text-white" />
          </button>
        </div>
        <h2 className="text-white text-2xl font-bold mt-4">{user.displayName || user.username}</h2>
        <p className="text-[#5288c1] text-sm mt-0.5">online</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-6">
        <button
          onClick={() => router.push('/settings')}
          className="flex flex-col items-center justify-center py-3 bg-[#232e3c] rounded-xl hover:bg-[#2b3947]"
        >
          <FaCamera className="text-white mb-1" size={20} />
          <span className="text-white text-xs">Set Photo</span>
        </button>
        <button
          onClick={() => router.push('/settings')}
          className="flex flex-col items-center justify-center py-3 bg-[#232e3c] rounded-xl hover:bg-[#2b3947]"
        >
          <FaEdit className="text-white mb-1" size={18} />
          <span className="text-white text-xs">Edit Info</span>
        </button>
        <button
          onClick={() => router.push('/settings')}
          className="flex flex-col items-center justify-center py-3 bg-[#232e3c] rounded-xl hover:bg-[#2b3947]"
        >
          <FaCog className="text-white mb-1" size={20} />
          <span className="text-white text-xs">Settings</span>
        </button>
      </div>

      {/* Info card */}
      <div className="mx-4 mt-4 bg-[#17212b] rounded-2xl p-4 space-y-3">
        {user.phone && (
          <div>
            <p className="text-white text-[15px]">{user.phone}</p>
            <p className="text-[#7f91a4] text-xs italic">Mobile</p>
          </div>
        )}
        {user.bio && (
          <div>
            <p className="text-white text-[15px]">{user.bio}</p>
            <p className="text-[#7f91a4] text-xs italic">Bio</p>
          </div>
        )}
        {user.username && (
          <div>
            <p className="text-white text-[15px]">@{user.username}</p>
            <p className="text-[#7f91a4] text-xs italic">Username</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center mt-6">
        <div className="flex bg-[#17212b] rounded-full p-1">
          <button
            onClick={() => setTab('posts')}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
              tab === 'posts' ? 'bg-[#2b3947] text-[#5288c1]' : 'text-[#7f91a4]'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
              tab === 'archived' ? 'bg-[#2b3947] text-[#5288c1]' : 'text-[#7f91a4]'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 mt-6">
        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-white font-semibold text-lg">No posts yet...</p>
            <p className="text-[#7f91a4] text-sm mt-1">
              Publish photos and videos to display on your profile page
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-5 inline-flex items-center gap-2 bg-[#5288c1] hover:bg-[#3e79ad] text-white px-6 py-2.5 rounded-full font-medium"
            >
              <FaCamera /> Add a post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/post/${p.id}`)}
                className="relative aspect-square bg-[#17212b] rounded overflow-hidden cursor-pointer"
              >
                {p.media?.startsWith('data:image') ? (
                  <Image src={p.media} alt="" fill className="object-cover" />
                ) : p.media?.startsWith('data:video') ? (
                  <video src={p.media} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7f91a4] text-xs">?</div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                  <FaHeart size={8} className="text-red-400" /> {p.likes || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
      }
