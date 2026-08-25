'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaCamera, FaTimes } from 'react-icons/fa';

const CLOUD_NAME = 'jtdafdgp';
const UPLOAD_PRESET = 'chatup';

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (!file || !user) return alert('Select a file');
    setUploading(true);
    try {
      const imageURL = await uploadToCloudinary(file);
      const posts = JSON.parse(localStorage.getItem('chatup_posts') || '[]');
      const newPost = {
        id: Date.now().toString(),
        text,
        imageURL,
        userId: user.id,
        likes: 0,
        timestamp: new Date().toISOString(),
      };
      posts.unshift(newPost);
      localStorage.setItem('chatup_posts', JSON.stringify(posts));
      alert('Posted!');
      setFile(null);
      setPreview(null);
      setText('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>
      <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-600 rounded-2xl p-10 text-center cursor-pointer">
        {preview ? (
          <div className="relative">
            <img src={preview} className="max-h-64 mx-auto rounded" />
            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-red-600 rounded-full p-1"><FaTimes className="text-white" /></button>
          </div>
        ) : (
          <div className="text-gray-400"><FaCamera size={40} className="mx-auto" /><p>Tap to choose photo</p></div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
      </div>
      <textarea className="w-full bg-gray-800 text-white p-4 rounded-xl mt-4" placeholder="Write a caption..." value={text} onChange={e => setText(e.target.value)} rows={3} />
      <button onClick={handleUpload} disabled={uploading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl mt-4">{uploading ? 'Uploading...' : 'Publish'}</button>
    </div>
  );
  }
