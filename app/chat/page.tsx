'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    setUsers(allUsers.filter((u: any) => u.id !== user?.id));
  }, [user]);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>
      {users.length === 0 && <p className="text-gray-400 text-center">No other users</p>}
      {users.map(u => (
        <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition">
          <FaUserCircle size={40} className="text-gray-400" />
          <div><p className="text-white font-semibold">{u.email}</p></div>
        </Link>
      ))}
    </div>
  );
}
