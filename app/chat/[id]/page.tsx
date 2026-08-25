'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  const loadMessages = async () => {
    if (!user || !id) return;
    const chatId = getChatId(user.id, id as string);
    try {
      const res = await fetch(`/api/chats?chatId=${chatId}`);
      const data = await res.json();
      setMessages(data);
    } catch (e) { console.error(e); }
  };

  const loadRecipient = async () => {
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      const found = users.find((u: any) => u.id === id);
      setRecipient(found);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadRecipient();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user]);

  const send = async () => {
    if (!text.trim() || !user || !id) return;
    const chatId = getChatId(user.id, id as string);
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, senderId: user.id, text }),
      });
      setText('');
      loadMessages();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-4 h-[85vh] flex flex-col pb-24 bg-black">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-3">
        {recipient?.photoURL ? <Image src={recipient.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">{recipient?.displayName?.[0]?.toUpperCase() || 'U'}</div>}
        <div><p className="text-white font-semibold">{recipient?.displayName || 'User'}</p><p className="text-gray-400 text-xs">@{recipient?.username || ''}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`p-2 rounded max-w-[70%] ${m.senderId === user?.id ? 'bg-blue-600 ml-auto' : 'bg-gray-700'}`}>{m.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-4">
        <input className="flex-1 bg-gray-800 text-white p-3 rounded-xl" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message..." />
        <button onClick={send} className="bg-blue-600 px-6 rounded-xl font-semibold">Send</button>
      </div>
    </div>
  );
      }
