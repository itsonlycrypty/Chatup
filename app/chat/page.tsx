'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchData } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaSearch, FaComment, FaUser, FaPlus, FaCheck } from 'react-icons/fa';

export default function ChatList() {
  const { user, allUsers } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const getChatId = (a: string, b: string) => [a, b].sort().join('_');

  const load = async () => {
    if (!user) return;
    const data = await fetchData();
    const users = data.users || [];
    const groups = data.groups || [];
    const allChats = data.chats || {};
    const allStories = data.stories || [];
    const now = new Date().getTime();

    // Build chat list: one entry per other user & each group
    const list: any[] = [];

    // Individual users
    users.forEach((u: any) => {
      if (u.id === user.id) return;
      const key = getChatId(user.id, u.id);
      const msgs = allChats[key] || [];
      const last = msgs[msgs.length - 1];
      list.push({
        id: u.id,
        type: 'user',
        name: u.displayName || u.username || u.phone,
        username: u.username,
        photoURL: u.photoURL,
        lastMessage: last?.text || '',
        lastTime: last?.timestamp || null,
        unread: msgs.filter((m: any) => m.senderId !== user.id && !m.read).length,
        isVerified: u.isVerified,
      });
    });

    // Groups
    groups.forEach((g: any) => {
      if (!g.members?.includes(user.id)) return;
      const msgs = allChats[g.id] || [];
      const last = msgs[msgs.length - 1];
      list.push({
        id: g.id,
        type: 'group',
        name: g.name,
        photoURL: g.picture,
        lastMessage: last?.text || 'Group created',
        lastTime: last?.timestamp || null,
        unread: 0,
      });
    });

    // Sort by last time desc
    list.sort((a, b) => {
      const ta = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tb = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return tb - ta;
    });

    setChats(list);

    // Stories
    const validStories = allStories
      .filter((s: any) => new Date(s.expiresAt).getTime() > now)
      .map((s: any) => {
        const owner = users.find((u: any) => u.id === s.userId);
        return { ...s, owner };
      });
    setStories(validStories);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const filtered = chats.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts: string | null) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0e1621] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-[#5288c1] rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1621] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h1 className="text-3xl font-bold text-white">Chat Up</h1>
        <button className="text-[#7f91a4]">
          <svg width="4" height="20" viewBox="0 0 4 20" fill="currentColor">
            <circle cx="2" cy="2" r="2" />
            <circle cx="2" cy="10" r="2" />
            <circle cx="2" cy="18" r="2" />
          </svg>
        </button>
      </div>

      {/* Stories row */}
      <div className="flex items-start gap-4 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {/* My Story */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center flex-shrink-0"
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#232e3c] border-2 border-transparent">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="Me" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl text-white">
                {(user?.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-[#5288c1] rounded-full p-1 border-2 border-[#0e1621]">
              <FaPlus size={10} className="text-white" />
            </div>
          </div>
          <span className="text-[11px] text-[#7f91a4] mt-1">My Story</span>
        </button>

        {/* Other stories */}
        {stories.map((s, i) => (
          <button key={i} className="flex flex-col items-center flex-shrink-0">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#5288c1] to-[#2f6ea8]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#232e3c] border-2 border-[#0e1621]">
                {s.owner?.photoURL ? (
                  <Image src={s.owner.photoURL} alt="Story" width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg text-white">
                    {(s.owner?.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-[#7f91a4] mt-1 truncate max-w-[64px]">
              {s.owner?.displayName || 'User'}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-[#7f91a4]" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-[#232e3c] text-white pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none placeholder-[#7f91a4]"
          />
        </div>
      </div>

      {/* Archived row */}
      <div
        onClick={() => {}}
        className="flex items-center gap-3 px-4 py-3 hover:bg-[#17212b] cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-[#232e3c] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#7f91a4">
            <path d="M20.54 5.23l-1.39-1.68A1.5 1.5 0 0 0 18 3H6c-.47 0-.88.21-1.15.55L3.46 5.23A1.5 1.5 0 0 0 3 6.24V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.24c0-.37-.1-.71-.26-1.01zM12 17L6.5 11.5l1.42-1.42L12 14.17l4.08-4.09 1.42 1.42L12 17z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-[15px]">Archived Chats</p>
          <p className="text-[#7f91a4] text-xs">Hidden conversations</p>
        </div>
      </div>

      {/* Chat list */}
      <div>
        {filtered.length === 0 ? (
          <p className="text-center text-[#7f91a4] py-10">No chats yet</p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#17212b] cursor-pointer active:bg-[#1c2733]"
            >
              <div className="relative flex-shrink-0">
                {c.photoURL ? (
                  <Image src={c.photoURL} alt="" width={52} height={52} className="w-13 h-13 rounded-full object-cover" />
                ) : (
                  <div className={`w-13 h-13 w-[52px] h-[52px] rounded-full flex items-center justify-center text-white font-bold text-lg ${c.type === 'group' ? 'bg-[#5288c1]' : 'bg-[#2f6ea8]'}`}>
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="text-white font-semibold text-[15px] truncate">
                    {c.name}
                    {c.isVerified && <span className="ml-1 text-[#5288c1] text-xs">✓</span>}
                  </p>
                  <span className="text-[#7f91a4] text-xs ml-2 flex-shrink-0">{formatTime(c.lastTime)}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[#7f91a4] text-[13px] truncate">
                    {c.lastMessage || 'No messages yet'}
                  </p>
                  {c.unread > 0 && (
                    <span className="ml-2 bg-[#5288c1] text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating new chat button */}
      <button
        onClick={() => router.push('/contacts')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#5288c1] flex items-center justify-center shadow-lg z-40"
      >
        <FaComment size={22} className="text-white" />
      </button>
    </div>
  );
    }
