'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  const loadMessages = () => {
    if (!user || !id) return;
    const chatId = getChatId(user.id, id as string);
    const chats = JSON.parse(localStorage.getItem('chatup_chats') || '{}');
    setMessages(chats[chatId] || []);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [id, user]);

  const send = async () => {
    if (!text.trim() || !user || !id) return;
    const chatId = getChatId(user.id, id as string);
    const chats = JSON.parse(localStorage.getItem('chatup_chats') || '{}');
    if (!chats[chatId]) chats[chatId] = [];
    const msg = { 
      id: Date.now().toString(), 
      senderId: user.id, 
      text, 
      timestamp: new Date().toISOString() 
    };
    chats[chatId].push(msg);
    localStorage.setItem('chatup_chats', JSON.stringify(chats));
    setText('');
    loadMessages();
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
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
        />
        <button onClick={send} className="bg-blue-600 px-6 rounded-xl">
          Send
        </button>
      </div>
    </div>
  );
      }
