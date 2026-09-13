'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchData } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaUserPlus, FaPhone, FaUser } from 'react-icons/fa';

export default function Contacts() {
  const { user, allUsers } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchData();
      const users = (data.users || []).filter((u: any) => u.id !== user.id);
      // Sort by last seen (using lastSeen or created)
      users.sort((a: any, b: any) => (a.displayName || '').localeCompare(b.displayName || ''));
      setContacts(users);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = contacts.filter((c) =>
    c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-[#5288c1] rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-white">Contacts</h1>
        <button className="text-[#7f91a4]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3zm0 5h12v2H3zm0 5h18v2H3z" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-[#7f91a4]" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts"
            className="w-full bg-[#232e3c] text-white pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none placeholder-[#7f91a4]"
          />
        </div>
      </div>

      {/* Invite & Recent */}
      <div className="px-4 space-y-3 mb-4">
        <button className="w-full flex items-center gap-4 bg-[#17212b] rounded-2xl px-4 py-3 hover:bg-[#1c2733]">
          <div className="w-11 h-11 rounded-full bg-[#5288c1] flex items-center justify-center">
            <FaUserPlus className="text-white" size={18} />
          </div>
          <span className="text-white text-[15px] font-medium">Invite Friends</span>
        </button>
        <button className="w-full flex items-center gap-4 bg-[#17212b] rounded-2xl px-4 py-3 hover:bg-[#1c2733]">
          <div className="w-11 h-11 rounded-full bg-[#4dcd5e] flex items-center justify-center">
            <FaPhone className="text-white" size={18} />
          </div>
          <span className="text-white text-[15px] font-medium">Recent calls</span>
        </button>
      </div>

      {/* Sorted heading */}
      <p className="px-4 pb-2 text-[#5288c1] text-sm font-medium">Sorted by name</p>

      {/* Contacts list */}
      <div>
        {filtered.length === 0 ? (
          <p className="text-center text-[#7f91a4] py-10">No contacts found</p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#17212b] cursor-pointer"
            >
              {c.photoURL ? (
                <Image src={c.photoURL} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2f6ea8] flex items-center justify-center text-white font-bold">
                  {c.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-[15px] truncate">
                  {c.displayName || c.username || 'User'}
                </p>
                <p className="text-[#7f91a4] text-xs italic">last seen recently</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating add contact button */}
      <button className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#5288c1] flex items-center justify-center shadow-lg z-40">
        <FaUserPlus size={20} className="text-white" />
      </button>
    </div>
  );
  }
