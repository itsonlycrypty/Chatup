'use client';
import { useState, useEffect } from 'react';
import { FaHeart, FaSearch, FaComment, FaPaperPlane, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import Image from 'next/image';
import FloatingPlusButton from '@/components/FloatingPlusButton';
import SearchModal from '@/components/SearchModal';
import { useAuth } from '@/context/AuthContext';

const BIN_ID = '6a8e0fb3da38895dfe106f8c';
const API_KEY = '$2a$10$r1kHroezSkMDu0f2HTVOQerg29AfetwH4AAKa6X8TDTIbliIda/OS';

const fetchData = async () => {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  const data = await res.json();
  return data.record;
};

const saveData = async (data: any) => {
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY
    },
    body: JSON.stringify(data)
  });
};

export default function Feed() {
  const { user, allUsers, followUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const loadPosts = async () => {
    const data = await fetchData();
    setPosts((data.posts || []).sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 5000);
    return () => clearInterval(interval);
  }, []);

  const like = async (postId: string) => {
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    await saveData({ ...data, posts });
    loadPosts();
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const data = await fetchData();
    const posts = data.posts || [];
    const idx = posts.findIndex((p: any) => p.id === postId);
    if (idx === -1) return;
    if (!posts[idx].comments) posts[idx].comments = [];
    posts[idx].comments.push({
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      timestamp: new Date().toISOString(),
    });
    await saveData({ ...data, posts });
    setCommentText({ ...commentText, [postId]: '' });
    loadPosts();
  };

  const getUser = (userId: string) => allUsers.find((u: any) => u.id === userId);

  const isFollowing = (userId: string) => {
    if (!user) return false;
    return user.following?.includes(userId) || false;
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        <button onClick={() => setShowSearch(true)} className="text-white hover:text-blue-400">
          <FaSearch size={24} />
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-center py-20">No posts yet. Tap + to upload!</p>
      ) : (
        <div className="space-y-6 p-2">
          {posts.map((p) => {
            const postUser = getUser(p.userId);
            const isFollowingUser = isFollowing(p.userId);
            return (
              <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden">
                {/* User header with follow button */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {postUser?.photoURL ? (
                      <Image src={postUser.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                        {postUser?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {postUser?.displayName || 'Unknown'}
                        {postUser?.isAdmin && <span className="ml-1 text-yellow-400 text-xs">⭐</span>}
                        {postUser?.isVerified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
                      </p>
                      <p className="text-gray-400 text-xs">@{postUser?.username || ''}</p>
                    </div>
                  </div>
                  {user && postUser && postUser.id !== user.id && (
                    <button
                      onClick={() => followUser(postUser.id)}
                      className={`text-xs px-3 py-1 rounded-full transition ${
                        isFollowingUser
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowingUser ? <FaUserCheck className="inline mr-1" /> : <FaUserPlus className="inline mr-1" />}
                      {isFollowingUser ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Media */}
                {p.media && p.media.startsWith('data:image') && (
                  <Image src={p.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
                )}
                {p.media && p.media.startsWith('data:video') && (
                  <video src={p.media} controls className="w-full h-auto object-cover" />
                )}
                {p.media && p.media.startsWith('http') && !p.media.startsWith('data:') && (
                  <div className="p-4">
                    {p.media.includes('youtube.com/watch') || p.media.includes('youtu.be') ? (
                      <div className="aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${p.media.split('v=')[1]?.split('&')[0] || p.media.split('/').pop()}`}
                          className="w-full h-full rounded"
                          allowFullScreen
                        />
                      </div>
                    ) : p.media.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <Image src={p.media} alt="External" width={400} height={400} className="w-full h-auto object-cover" />
                    ) : p.media.match(/\.(mp4|webm|mov)$/i) ? (
                      <video src={p.media} controls className="w-full h-auto object-cover" />
                    ) : (
                      <div className="p-4 bg-gray-800 rounded">
                        <p className="text-blue-400 break-all">
                          <a href={p.media} target="_blank" rel="noopener noreferrer">🔗 Open Link</a>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Caption */}
                {p.text && <div className="px-3 py-1"><p className="text-white text-sm">{p.text}</p></div>}

                {/* Likes and Comments count */}
                <div className="flex items-center gap-4 px-3 py-2 text-gray-400 text-xs">
                  <button onClick={() => like(p.id)} className="flex items-center gap-1 hover:text-red-400 transition">
                    <FaHeart className="text-red-400" /> {p.likes || 0}
                  </button>
                  <span className="flex items-center gap-1">
                    <FaComment /> {(p.comments?.length || 0)}
                  </span>
                </div>

                {/* Comments list */}
                {(p.comments?.length || 0) > 0 && (
                  <div className="px-3 pb-2 space-y-1">
                    {p.comments.slice(-3).map((c: any) => (
                      <div key={c.id} className="text-sm">
                        <span className="text-blue-400 font-semibold">@{c.username}</span>
                        <span className="text-gray-300 ml-2">{c.text}</span>
                      </div>
                    ))}
                    {p.comments.length > 3 && (
                      <p className="text-gray-500 text-xs">+{p.comments.length - 3} more</p>
                    )}
                  </div>
                )}

                {/* Comment input */}
                {user && (
                  <div className="flex items-center gap-2 p-3 border-t border-gray-800">
                    <input
                      className="flex-1 bg-gray-800 text-white p-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a comment..."
                      value={commentText[p.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [p.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)}
                    />
                    <button onClick={() => addComment(p.id)} className="text-blue-500 hover:text-blue-400">
                      <FaPaperPlane />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FloatingPlusButton />
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </div>
  );
}
