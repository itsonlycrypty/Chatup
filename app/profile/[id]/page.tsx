'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import { FaHeart, FaComment, FaShare, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Image from 'next/image';
import VideoEmbed from '@/components/VideoEmbed';

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [isShort, setIsShort] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  const loadPost = async () => {
    const data = await fetchData();
    // Search in posts and shorts
    const foundPost = data.posts?.find((p: any) => p.id === id) ||
                      data.shorts?.find((s: any) => s.id === id);
    if (foundPost) {
      setPost(foundPost);
      setIsShort(!!data.shorts?.find((s: any) => s.id === id));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadPost();
  }, [id]);

  const like = async () => {
    if (!post) return;
    const data = await fetchData();
    const target = isShort ? data.shorts : data.posts;
    const idx = target.findIndex((p: any) => p.id === id);
    if (idx === -1) return;
    target[idx].likes = (target[idx].likes || 0) + 1;
    await saveData({ ...data, posts: data.posts || [], shorts: data.shorts || [] });
    loadPost();
  };

  const addComment = async () => {
    const text = commentText.trim();
    if (!text || !user || !post) return;
    const data = await fetchData();
    const target = isShort ? data.shorts : data.posts;
    const idx = target.findIndex((p: any) => p.id === id);
    if (idx === -1) return;
    if (!target[idx].comments) target[idx].comments = [];
    target[idx].comments.push({
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      text,
      timestamp: new Date().toISOString(),
    });
    await saveData({ ...data, posts: data.posts || [], shorts: data.shorts || [] });
    setCommentText('');
    loadPost();
  };

  const deletePost = async () => {
    if (!post || post.userId !== user?.id) return;
    if (!confirm('Delete this post?')) return;
    const data = await fetchData();
    const target = isShort ? data.shorts : data.posts;
    const idx = target.findIndex((p: any) => p.id === id);
    if (idx === -1) return;
    target.splice(idx, 1);
    await saveData({ ...data, posts: data.posts || [], shorts: data.shorts || [] });
    router.push('/profile');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }
  if (!post) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Post not found</div>;
  }

  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => router.back()} className="text-white hover:text-gray-300">
          <FaArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Post Details</h1>
        {user && post.userId === user.id && (
          <button onClick={deletePost} className="text-red-500 hover:text-red-400 ml-auto">
            <FaTrash size={20} />
          </button>
        )}
      </div>

      {/* Post content */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        {post.media && post.media.startsWith('data:image') && (
          <Image src={post.media} alt="Post" width={400} height={400} className="w-full h-auto object-cover" />
        )}
        {post.media && post.media.startsWith('data:video') && (
          <video src={post.media} controls className="w-full h-auto object-cover" />
        )}
        {post.media && post.media.startsWith('http') && !post.media.startsWith('data:') && (
          <VideoEmbed url={post.media} />
        )}
        {post.text && <div className="p-4 text-white">{post.text}</div>}
      </div>

      {/* Likes and share */}
      <div className="flex items-center gap-6 mt-4 text-gray-400">
        <button onClick={like} className="flex items-center gap-1 hover:text-red-400 transition">
          <FaHeart className="text-red-400" /> {post.likes || 0}
        </button>
        <span className="flex items-center gap-1">
          <FaComment /> {(post.comments?.length || 0)}
        </span>
        <button onClick={() => navigator.share?.({ title: post.text, url: post.media })} className="hover:text-blue-400">
          <FaShare />
        </button>
      </div>

      {/* Comments */}
      <div className="mt-6">
        <h3 className="text-white font-semibold mb-2">Comments</h3>
        {(post.comments?.length || 0) === 0 ? (
          <p className="text-gray-400 text-sm">No comments yet.</p>
        ) : (
          post.comments.map((c: any) => (
            <div key={c.id} className="bg-gray-800 p-3 rounded-xl mb-2">
              <span className="text-blue-400 font-semibold">@{c.username}</span>
              <span className="text-white ml-2">{c.text}</span>
            </div>
          ))
        )}
        {user && (
          <div className="flex items-center gap-2 mt-3">
            <input
              className="flex-1 bg-gray-800 text-white p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
            />
            <button onClick={addComment} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Post</button>
          </div>
        )}
      </div>
    </div>
  );
}
