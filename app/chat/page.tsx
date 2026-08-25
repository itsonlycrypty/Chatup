'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';

export default function ChatList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    // In a real app, we'd fetch users from the server
    // For now, we'll use a placeholder
    const fetchUsers = async () => {
      // Get all users from Redis (you can add this API endpoint)
      // For now, show a placeholder
      setUsers([
        { id: '1', email: 'demo@example.com' },
      ]);
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>
      {users.length === 0 && <p className="text-gray-400 text-center mt-10">No users yet</p>}
      {users.map((u) => (
        <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition">
          <FaUserCircle size={40} className="text-gray-400" />
          <div>
            <p className="text-white font-semibold">{u.email}</p>
          </div>
        </Link>
      ))}
    </div>
  );
      }
