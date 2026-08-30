'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchData } from '@/lib/db';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SavedMessages() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const saved = data.savedMessages || [];
      setMessages(saved.filter((s: any) => s.userId === user?.id));
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 pb-24">
      <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400 flex items-center gap-2 mb-4">
        <FaArrowLeft /> Back
      </button>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Saved Messages</h1>
      {messages.length === 0 ? (
        <p className="text-gray-400 text-center">No saved messages</p>
      ) : (
        messages.map((m) => (
          <div key={m.id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-2">
            <p className="text-[var(--text)]">{m.text}</p>
            <p className="text-gray-400 text-xs">{new Date(m.savedAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
          }
