'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { FaCamera, FaTimes } from 'react-icons/fa';

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return alert('Select a file first');
    if (!storage || !db) return alert('Firebase not initialized');
    setUploading(true);
    try {
      const path = `posts/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        text: text,
        [file.type.startsWith('video') ? 'videoURL' : 'imageURL']: url,
        likes: 0,
        timestamp: new Date(),
      });
      alert('Posted successfully!');
      setFile(null);
      setPreview(null);
      setText('');
      if (fileRef.current) fileRef.current.value = '';
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
    <div className="p-6 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>
      <div
        onClick={() => fileRef.current?.click()}
        className="relative border-2 border-dashed border-gray-600 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500 transition bg-gray-800/30"
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
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <FaCamera size={40} />
            <p>Tap to choose photo or video</p>
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
        className="w-full bg-gray-800 text-white p-4 rounded-xl mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write a caption..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mt-4 transition disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Publish'}
      </button>
    </div>
  );
        }
