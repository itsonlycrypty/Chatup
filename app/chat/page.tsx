'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle, FaSearch } from 'react-icons/fa';
import Image from 'next/image';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const all = await res.json();
      const others = all.filter((u: any) => u.id !== user?.id);
      setUsers(others);
      setFiltered(others);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (user) loadUsers();
  }, [user]);

  useEffect(() => {
    if (query.trim() === '') setFiltered(users);
    else {
      setFiltered(users.filter((u: any) =>
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      ));
    }
  }, [query, users]);

  return (
    <div className="p-4 pb-24 min-h-screen bg-black">
      <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">{query ? 'No users found' : 'No other users'}</p>
      ) : (
        filtered.map((u) => (
          <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition">
            {u.photoURL ? <Image src={u.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" /> : <FaUserCircle size={40} className="text-gray-400" />}
            <div>
              <p className="text-white font-semibold">{u.displayName || u.email}</p>
              <p className="text-gray-400 text-sm">@{u.username || ''}</p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
  }
