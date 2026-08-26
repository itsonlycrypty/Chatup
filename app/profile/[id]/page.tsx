'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData } from '@/lib/db';
import { FaArrowLeft, FaUserCircle, FaHeart, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function UserProfile() {
  const { id } = useParams();
  const router = useRouter();
  const { user, followUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const users = data.users || [];
      const found = users.find((u: any) => u.id === id);
      if (found) {
        setProfileUser(found);
        const userPosts = (data.posts || []).filter((p: any) => p.userId === id);
        setPosts(userPosts);
      }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }
  if (!profileUser) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">User not found</div>;
  }

  const isFollowing = user?.following?.includes(id) || false;

  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      <button onClick={() => router.back()} className="text-white hover:text-gray-300 mb-4 flex items-center gap-2">
        <FaArrowLeft /> Back
      </button>

      <div className="bg-gray-900 rounded-2xl p-6 text-center">
        {profileUser.photoURL ? (
          <Image src={profileUser.photoURL} alt="Profile" width={80} height={80} className="rounded-full mx-auto border-2 border-blue-500" />
        ) : (
          <FaUserCircle size={80} className="text-gray-400 mx-auto" />
        )}
        <h2 className="text-2xl font-bold text-white mt-2">
          {profileUser.displayName || profileUser.email}
          {profileUser.isAdmin && (
            <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">Owner</span>
          )}
          {profileUser.isVerified && (
            <span className="ml-1 text-blue-500" title="Verified">
              <FaCheckCircle className="inline" size={18} />
            </span>
          )}
        </h2>
        <p className="text-gray-400">@{profileUser.username}</p>
        {profileUser.bio && <p className="text-white mt-2">{profileUser.bio}</p>}
        {user && user.id !== id && (
          <button
            onClick={() => followUser(id)}
            className={`mt-4 px-6 py-2 rounded-full text-sm font-semibold transition ${
              isFollowing ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-white font-semibold mb-3">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p) => (
              <Link key={p.id} href={`/post/${p.id}`} className="relative aspect-square bg-gray-800 rounded overflow-hidden">
                {p.media?.startsWith('data:image') ? (
                  <Image src={p.media} alt="Post" fill className="object-cover" />
                ) : p.media?.startsWith('data:video') ? (
                  <video src={p.media} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400 text-xs">🔗</div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <FaHeart className="text-red-400" size={10} /> {p.likes || 0}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
            }
