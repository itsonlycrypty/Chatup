'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join('_');

  const fetchMessages = async () => {
    if (!user) return;
    const chatId = getChatId(user.id, id);
    const res = await fetch(`/api/chats?chatId=${chatId}`);
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, [id, user]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    const chatId = getChatId(user.id, id);
    await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, senderId: user.id, text }),
    });
    setText('');
    fetchMessages();
  };

  return (
    <div className="p-4 h-[85vh] flex flex-col pb-24">
      <h2 className="text-xl font-bold text-white mb-4">Chat</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded max-w-[70%] ${
              m.senderId === user?.id ? 'bg-blue-600 ml-auto' : 'bg-gray-700'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-semibold transition">
          Send
        </button>
      </div>
    </div>
  );
          }
