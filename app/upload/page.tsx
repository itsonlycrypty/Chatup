'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

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

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">📸 Create Post</h1>
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer"
      >
        {preview ? (
          file?.type.startsWith('video') ? (
            <video src={preview} controls className="max-h-64 mx-auto" />
          ) : (
            <img src={preview} className="max-h-64 mx-auto" />
          )
        ) : (
          <p className="text-gray-400">Tap to take Photo/Video (Camera enabled in APK)</p>
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
        className="w-full bg-gray-800 p-3 rounded mt-4"
        placeholder="Write a caption..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full bg-blue-600 p-3 rounded font-bold mt-4 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Publish to Feed'}
      </button>
    </div>
  );
                            }
