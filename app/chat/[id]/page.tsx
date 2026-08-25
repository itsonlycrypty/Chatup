'use client';
import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>(); // recipient UID
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join('_');

  useEffect(() => {
    if (!user || !id) return;
    if (!db) return; // ✅ Stop if Firebase not initialized
    // Fetch recipient name
    const fetchName = async () => {
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecipientName(data.displayName || data.email || 'User');
      }
    };
    fetchName();

    const chatId = getChatId(user.uid, id);
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [user, id]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    if (!db) return;
    const chatId = getChatId(user.uid, id);
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid,
      text,
      timestamp: new Date(),
    });
    setText('');
  };

  return (
    <div className="p-4 h-[85vh] flex flex-col pb-24">
      <h2 className="text-xl font-bold mb-4">Chat with {recipientName}</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded max-w-[70%] ${
              m.senderId === user?.uid ? 'bg-blue-600 ml-auto' : 'bg-gray-700'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 bg-gray-800 p-3 rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-600 px-6 rounded">
          Send
        </button>
      </div>
    </div>
  );
        }
