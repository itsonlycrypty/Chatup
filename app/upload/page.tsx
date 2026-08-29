'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaTimes, FaCheck, FaClock, FaLink, FaUser, FaSmile } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';

export default function Upload() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [postType, setPostType] = useState<'post' | 'story'>('post');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setExternalUrl('');
    }
  };

  const handleUpload = async () => {
    if (!user) return alert('Please login first');
    if (!file && !externalUrl.trim()) return alert('Select a file or paste a URL');

    setUploading(true);
    try {
      let media = '';
      if (file) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        media = dataUrl;
      } else {
        media = externalUrl.trim();
      }

      const data = await fetchData();
      const posts = data.posts || [];
      const newItem = {
        id: Date.now().toString(),
        text: text || '',
        media,
        userId: user.id,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        type: postType,
        privacy,
      };
      if (postType === 'story') {
        const stories = data.stories || [];
        stories.push({ ...newItem, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
        await saveData({ ...data, stories });
      } else {
        posts.unshift(newItem);
        await saveData({ ...data, posts });
      }
      alert('Posted!');
      router.push('/feed');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const clearPreview = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <FaTimes size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Create Post</h1>
          <button
            onClick={handleUpload}
            disabled={uploading || (!file && !externalUrl.trim())}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition disabled:opacity-50"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-semibold">{user?.displayName || user?.email}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{privacy === 'public' ? '🌍 Public' : privacy === 'friends' ? '👥 Friends' : '🔒 Private'}</span>
              <span className="mx-1">•</span>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="bg-transparent text-gray-500 text-xs focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        {/* Media picker */}
        <div
          onClick={() => fileRef.current?.click()}
          className="mx-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
        >
          {preview ? (
            <div className="relative">
              {file?.type.startsWith('video') ? (
                <video src={preview} controls className="max-h-64 mx-auto rounded" />
              ) : (
                <img src={preview} className="max-h-64 mx-auto rounded" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); clearPreview(); }}
                className="absolute top-2 right-2 bg-red-600 rounded-full p-1"
              >
                <FaTimes className="text-white" />
              </button>
            </div>
          ) : (
            <div className="text-gray-400 py-6">
              <FaCamera size={40} className="mx-auto" />
              <p className="mt-2">Tap to add photo or video</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* External URL input */}
        <div className="mx-4 mt-3 relative">
          <FaLink className="absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Or paste video/image URL"
            value={externalUrl}
            onChange={(e) => {
              setExternalUrl(e.target.value);
              if (e.target.value) clearPreview();
            }}
          />
        </div>

        {/* Caption */}
        <textarea
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 mt-3 mx-auto rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ width: 'calc(100% - 2rem)' }}
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />

        {/* Post / Story toggle */}
        <div className="flex gap-3 mx-4 mt-3">
          <button
            onClick={() => setPostType('post')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              postType === 'post' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FaCheck className="inline mr-1" /> Post
          </button>
          <button
            onClick={() => setPostType('story')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              postType === 'story' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <FaClock className="inline mr-1" /> Story (24h)
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={() => router.push('/feed')}
          className="w-full text-gray-500 text-sm py-3 hover:text-gray-700 dark:hover:text-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
    }
