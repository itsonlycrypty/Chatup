'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle, FaSearch, FaRobot, FaCheckCircle, FaPlus, FaShare, FaUser, FaUsers } from 'react-icons/fa';
import Image from 'next/image';
import { fetchData } from '@/lib/db';
import { getAllAIs } from '@/lib/aiData';

export default function ChatList() {
  const { user } = useAuth();
  const [chatItems, setChatItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'ai'>('all');

  // Load users and AIs
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchData();
      const realUsers = data.users || [];
      const others = realUsers.filter((u: any) => u.id !== user.id);
      const allAIs = await getAllAIs();
      const aiList = allAIs.map(ai => ({
        id: ai.id,
        email: ai.name,
        displayName: ai.name,
        username: ai.username,
        photoURL: ai.avatar,
        isAI: true,
        isOfficial: ai.isOfficial || false,
        background: ai.background,
        description: ai.description,
        speciality: ai.speciality,
        voice: ai.voice,
        isMale: ai.isMale,
        isCustom: ai.isCustom || false,
        createdBy: ai.createdBy,
        systemPrompt: ai.systemPrompt,
      }));
      const all = [...others, ...aiList];
      setChatItems(all);
      setFiltered(all);
    };
    load();
  }, [user]);

  // Filter by tab and search
  useEffect(() => {
    let items = chatItems;
    if (activeTab === 'users') items = items.filter((u: any) => !u.isAI);
    if (activeTab === 'ai') items = items.filter((u: any) => u.isAI);
    if (query.trim()) {
      items = items.filter((u: any) =>
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFiltered(items);
  }, [query, chatItems, activeTab]);

  // Generate invite link
  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?ref=${user?.id || ''}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Chat Up!',
        text: 'Install Chat Up and connect with me!',
        url: link,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(link).then(() => {
        alert('Invite link copied to clipboard!');
      });
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 dark:bg-black">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
        <div className="flex gap-2">
          <button
            onClick={generateInviteLink}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
            title="Invite someone"
          >
            <FaShare size={18} />
          </button>
          <Link href="/chat/create-ai" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
            <FaPlus size={18} />
          </Link>
        </div>
      </div>
      {/* Search */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
        <input
          className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search users or AI assistants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <FaUsers className="inline mr-1" /> All
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <FaUser className="inline mr-1" /> Users
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
            activeTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <FaRobot className="inline mr-1" /> AI
        </button>
      </div>
      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-10">{query ? 'No results found' : 'No chats yet'}</p>
      ) : (
        filtered.map((u) => (
          <Link key={u.id} href={`/chat/${u.id}`} className="flex items-center gap-4 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-4 rounded-2xl mb-3 transition shadow-sm">
            {u.photoURL ? (
              <Image src={u.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <FaUserCircle size={40} className="text-gray-400" />
            )}
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                {u.displayName || u.email}
                {u.isAI && <FaRobot className="text-blue-400 text-sm" title="AI Assistant" />}
                {u.isOfficial && <FaCheckCircle className="text-blue-500 text-sm" title="Verified Official AI" />}
                {u.isCustom && <span className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">Custom</span>}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {u.isAI ? `🤖 ${u.speciality || 'AI Assistant'}` : `@${u.username || ''}`}
              </p>
            </div>
            {u.isAI ? (
              <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded-full">AI</span>
            ) : (
              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">User</span>
            )}
          </Link>
        ))
      )}
    </div>
  );
          }
