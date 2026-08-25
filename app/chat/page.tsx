'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle, FaSearch } from 'react-icons/fa';
import Image from 'next/image';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('chatup_users') || '[]');
    const others = allUsers.filter((u: any) => u.id !== user?.id);
    setUsers(others);
    setFilteredUsers(others);
  }, [user]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((u: any) =>
        u.username?.toLowerCase().includes(term.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(term.toLowerCase()) ||
        u.email?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-black">
      <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by username or name..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">
          {searchTerm ? 'No users found' : 'No other users'}
        </p>
      ) : (
        filteredUsers.map((u) => (
          <Link
            key={u.id}
            href={`/chat/${u.id}`}
            className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition"
          >
            {u.photoURL ? (
              <Image
                src={u.photoURL}
                alt="Avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle size={40} className="text-gray-400" />
            )}
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
