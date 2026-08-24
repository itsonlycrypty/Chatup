'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<{ id: string; email: string; displayName?: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as { id: string; email: string; displayName?: string }))
        .filter((u) => u.id !== user.uid);
      setUsers(list);
    };
    fetchUsers();
  }, [user]);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">💬 Chats</h1>
      {users.length === 0 && <p className="text-gray-400">No other users yet.</p>}
      {users.map((u) => (
        <Link key={u.id} href={`/chat/${u.id}`} className="block bg-gray-800 p-4 rounded-xl mb-2">
          <p className="font-bold">{u.displayName || u.email}</p>
          <p className="text-sm text-gray-400">{u.email}</p>
        </Link>
      ))}
    </div>
  );
        }
