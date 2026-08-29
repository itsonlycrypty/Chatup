'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaCamera } from 'react-icons/fa';
import Image from 'next/image';

export default function CreateChannel() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [picture, setPicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPicture(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createChannel = async () => {
    if (!name.trim()) return alert('Channel name required');
    const channelId = `channel_${Date.now()}`;
    const channel = {
      id: channelId,
      name: name.trim(),
      description: description.trim() || '',
      picture: picture || null,
      owner: user.id,
      admins: [user.id],
      members: [user.id], // owner is a member
      createdAt: new Date().toISOString(),
      type: 'channel',
    };
    const data = await fetchData();
    const channels = data.channels || [];
    channels.push(channel);
    // Initialize chat
    const chats = data.chats || {};
    chats[channelId] = [];
    await saveData({ ...data, channels, chats });
    router.push(`/chat/${channelId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 pb-24">
      <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400 flex items-center gap-2 mb-4">
        <FaArrowLeft /> Back
      </button>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Create Channel</h1>
      <div className="flex flex-col items-center mb-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer border-2 border-blue-500 flex items-center justify-center"
        >
          {picture ? (
            <Image src={picture} alt="Channel" width={96} height={96} className="w-full h-full object-cover" />
          ) : (
            <FaCamera size={32} className="text-gray-400" />
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
        <p className="text-xs text-gray-500 mt-1">Tap to add channel picture</p>
      </div>
      <input
        className="w-full bg-gray-100 dark:bg-gray-800 text-[var(--text)] p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Channel Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="w-full bg-gray-100 dark:bg-gray-800 text-[var(--text)] p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <button
        onClick={createChannel}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition"
      >
        Create Channel
      </button>
    </div>
  );
        }
