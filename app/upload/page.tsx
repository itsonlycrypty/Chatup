'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaTimes, FaCheck, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Upload() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [postType, setPostType] = useState<'post' | 'story'>('post');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return alert('Select a file');
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newItem = {
          id: Date.now().toString(),
          text,
          media: dataUrl,
          userId: user.id,
          likes: 0,
          timestamp: new Date().toISOString(),
          type: postType,
        };

        if (postType === 'story') {
          const stories = JSON.parse(localStorage.getItem('chatup_stories') || '[]');
          stories.push({
            ...newItem,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          localStorage.setItem('chatup_stories', JSON.stringify(stories));
        } else {
          const posts = JSON.parse(localStorage.getItem('chatup_posts') || '[]');
          posts.unshift(newItem);
          localStorage.setItem('chatup_posts', JSON.stringify(posts));
        }
        alert(`${postType === 'story' ? 'Story' : 'Post'} uploaded!`);
        router.push('/feed');
      };
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
    <div className="min-h-screen bg-black p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md rounded-3xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Create New</h1>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-600 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
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
            <div className="text-gray-400 py-8">
              <FaCamera size={48} className="mx-auto" />
              <p className="mt-2">Tap to choose photo or video</p>
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

        <textarea
          className="w-full bg-gray-700/50 text-white p-4 rounded-xl mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add a caption..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setPostType('post')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              postType === 'post'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <FaCheck className="inline mr-1" /> Post
          </button>
          <button
            onClick={() => setPostType('story')}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              postType === 'story'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <FaClock className="inline mr-1" /> Story (24h)
          </button>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl mt-4 transition disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Publish'}
        </button>

        <button
          onClick={() => router.push('/feed')}
          className="w-full text-gray-400 text-sm mt-3 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
                                                          }
