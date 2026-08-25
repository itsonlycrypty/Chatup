'use client';
import { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim() === '') { setResults([]); return; }
    try {
      const res = await fetch(`/api/users?query=${q}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between mb-4">
          <h2 className="text-white font-bold">Search Users</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes /></button>
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or name..."
            className="w-full bg-gray-700 text-white p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </div>
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {results.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`} onClick={onClose} className="flex items-center gap-3 bg-gray-700 p-3 rounded-xl hover:bg-gray-600 transition">
              {u.photoURL ? <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">{u.displayName?.[0]?.toUpperCase() || 'U'}</div>}
              <div><p className="text-white font-semibold">{u.displayName || u.email}</p><p className="text-gray-400 text-xs">@{u.username}</p></div>
            </Link>
          ))}
          {results.length === 0 && query && <p className="text-gray-400 text-center">No users found</p>}
        </div>
      </div>
    </div>
  );
            }
