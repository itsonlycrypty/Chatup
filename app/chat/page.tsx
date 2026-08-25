'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FaUserCircle } from 'react-icons/fa';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<{ id: string; email: string; displayName?: string }[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as { id: string; email: string; displayName?: string }))
        .filter((u) => u.id !== user.uid);
      setUsers(list);
    };
    fetchUsers();
  }, [user]);

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>
      {users.length === 0 && <p className="text-gray-400 text-center mt-10">No users yet</p>}
      {users.map((u) => (
        <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition">
          <FaUserCircle size={40} className="text-gray-400" />
          <div>
            <p className="text-white font-semibold">{u.displayName || u.email}</p>
            <p className="text-gray-400 text-sm">{u.email}</p>
          </div>
        </Link>
      ))}
    </div>
  );
          }
