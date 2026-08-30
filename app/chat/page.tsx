'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle, FaSearch, FaRobot, FaCheckCircle, FaPlus, FaShare, FaUser, FaUsers, FaUserPlus, FaChalkboardTeacher } from 'react-icons/fa';
import Image from 'next/image';
import { fetchData, saveData } from '@/lib/db';
import { getAllAIs, PREDEFINED_AI_LIST } from '@/lib/aiData';

export default function ChatList() {
  const { user, followUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'ai' | 'groups' | 'channels'>('all');
  const [stories, setStories] = useState<any[]>([]);

  // Load stories from followed users
  useEffect(() => {
    const loadStories = async () => {
      if (!user) return;
      const data = await fetchData();
      const allStories = data.stories || [];
      const now = new Date().getTime();
      const following = user.following || [];
      const relevantUsers = [...following, user.id];
      const validStories = allStories.filter((s: any) => {
        const expires = new Date(s.expiresAt).getTime();
        return relevantUsers.includes(s.userId) && expires > now;
      });
      const storyMap = new Map();
      validStories.forEach((s: any) => {
        if (!storyMap.has(s.userId) || new Date(s.timestamp).getTime() > new Date(storyMap.get(s.userId).timestamp).getTime()) {
          storyMap.set(s.userId, s);
        }
      });
      const storyList = Array.from(storyMap.values());
      const users = data.users || [];
      const storyWithUsers = storyList.map((s: any) => {
        const u = users.find((usr: any) => usr.id === s.userId);
        return { ...s, user: u };
      });
      setStories(storyWithUsers);
    };
    loadStories();
  }, [user]);

  // Load chats (users, AIs, groups, channels)
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchData();
      const realUsers = data.users || [];
      const others = realUsers.filter((u: any) => u.id !== user.id);
      const allAIs = await getAllAIs();
      const aiFollowers = data.aiFollowers || {};
      const aiList = allAIs.map(ai => {
        const followers = aiFollowers[ai.id] || [];
        return {
          id: ai.id,
          email: ai.name,
          displayName: ai.name,
          username: ai.username,
          photoURL: ai.avatar,
          isAI: true,
          isOfficial: ai.isOfficial || false,
          isCustom: ai.isCustom || false,
          speciality: ai.speciality,
          followers: followers,
          isFollowing: followers.includes(user.id),
        };
      });
      const groups = (data.groups || []).map((g: any) => ({
        id: g.id,
        displayName: g.name,
        username: g.name,
        photoURL: g.picture,
        isGroup: true,
        members: g.members,
      }));
      const channels = (data.channels || []).map((c: any) => ({
        id: c.id,
        displayName: c.name,
        username: c.name,
        photoURL: c.picture,
        isChannel: true,
        members: c.members,
        admins: c.admins,
        owner: c.owner,
        onlyAdminsCanSend: c.onlyAdminsCanSend || false,
      }));
      const all = [...others, ...aiList, ...groups, ...channels];
      setItems(all);
      setFiltered(all);
    };
    load();
  }, [user]);

  // Filter by tab and search
  useEffect(() => {
    let itemsFiltered = items;
    if (activeTab === 'users') itemsFiltered = itemsFiltered.filter((u: any) => !u.isAI && !u.isGroup && !u.isChannel);
    if (activeTab === 'ai') itemsFiltered = itemsFiltered.filter((u: any) => u.isAI);
    if (activeTab === 'groups') itemsFiltered = itemsFiltered.filter((u: any) => u.isGroup);
    if (activeTab === 'channels') itemsFiltered = itemsFiltered.filter((u: any) => u.isChannel);
    if (query.trim()) {
      itemsFiltered = itemsFiltered.filter((u: any) =>
        u.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFiltered(itemsFiltered);
  }, [query, items, activeTab]);

  // Follow AI
  const followAI = async (aiId: string) => {
    if (!user) return;
    const data = await fetchData();
    const aiFollowers = data.aiFollowers || {};
    if (!aiFollowers[aiId]) aiFollowers[aiId] = [];
    if (!aiFollowers[aiId].includes(user.id)) {
      aiFollowers[aiId].push(user.id);
      await saveData({ ...data, aiFollowers });
      // Refresh list
      const allAIs = await getAllAIs();
      const updatedAiList = allAIs.map(ai => ({
        ...ai,
        followers: aiFollowers[ai.id] || [],
        isFollowing: (aiFollowers[ai.id] || []).includes(user.id),
      }));
      setItems(prev => prev.map(item => {
        if (item.isAI && item.id === aiId) {
          const ai = updatedAiList.find(a => a.id === aiId);
          return { ...item, followers: ai?.followers || [], isFollowing: ai?.isFollowing || false };
        }
        return item;
      }));
    }
  };

  // Unfollow AI
  const unfollowAI = async (aiId: string) => {
    if (!user) return;
    const data = await fetchData();
    const aiFollowers = data.aiFollowers || {};
    if (aiFollowers[aiId]) {
      aiFollowers[aiId] = aiFollowers[aiId].filter((id: string) => id !== user.id);
      await saveData({ ...data, aiFollowers });
      // Refresh list
      const allAIs = await getAllAIs();
      const updatedAiList = allAIs.map(ai => ({
        ...ai,
        followers: aiFollowers[ai.id] || [],
        isFollowing: (aiFollowers[ai.id] || []).includes(user.id),
      }));
      setItems(prev => prev.map(item => {
        if (item.isAI && item.id === aiId) {
          const ai = updatedAiList.find(a => a.id === aiId);
          return { ...item, followers: ai?.followers || [], isFollowing: ai?.isFollowing || false };
        }
        return item;
      }));
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-24">
      {/* Stories row */}
      {stories.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-3 mb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
                <FaPlus size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Your Story</p>
          </div>
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 text-center cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden">
                  {story.user?.photoURL ? (
                    <Image src={story.user.photoURL} alt="Story" width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle size={56} className="text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate w-14">{story.user?.displayName || 'User'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
        <div className="flex gap-2">
          <button
            onClick={generateInviteLink}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
            title="Invite"
          >
            <FaShare size={18} />
          </button>
          <Link href="/chat/create-group" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition" title="Create Group">
            <FaUserPlus size={18} />
          </Link>
          <Link href="/channel/create" className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-full transition" title="Create Channel">
            <FaChalkboardTeacher size={18} />
          </Link>
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
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          AI
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'groups' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Groups
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'channels' ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Channels
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-10">{query ? 'No results' : 'No chats'}</p>
      ) : (
        filtered.map((u) => {
          const isAI = u.isAI;
          const isFollowing = u.isFollowing || false;
          const followerCount = u.followers?.length || 0;
          return (
            <div key={u.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-4 rounded-2xl mb-3 transition shadow-sm">
              {u.photoURL ? (
                <Image src={u.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : u.isGroup ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">G</div>
              ) : u.isChannel ? (
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">C</div>
              ) : (
                <FaUserCircle size={40} className="text-gray-400" />
              )}
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                  {u.displayName || u.email || u.name}
                  {isAI && <FaRobot className="text-blue-400 text-sm" title="AI Assistant" />}
                  {u.isOfficial && <FaCheckCircle className="text-blue-500 text-sm" title="Verified Official AI" />}
                  {u.isCustom && <span className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded-full">Custom</span>}
                  {u.isGroup && <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">Group</span>}
                  {u.isChannel && <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded-full">Channel</span>}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isAI ? `🤖 ${u.speciality || 'AI'} • ${followerCount} followers` : u.isGroup ? `${u.members?.length || 0} members` : u.isChannel ? `${u.members?.length || 0} members` : `@${u.username || ''}`}
                </p>
              </div>
              {isAI ? (
                <div className="flex items-center gap-2">
                  {!isFollowing ? (
                    <button
                      onClick={() => followAI(u.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
                    >
                      Follow
                    </button>
                  ) : (
                    <button
                      onClick={() => unfollowAI(u.id)}
                      className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700"
                    >
                      Following
                    </button>
                  )}
                  {isFollowing && (
                    <Link href={`/chat/${u.id}`} className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">
                      Chat
                    </Link>
                  )}
                </div>
              ) : (
                <Link href={u.isGroup ? `/chat/${u.id}` : `/chat/${u.id}`} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">
                  Chat
                </Link>
              )}
            </div>
          );
        })
      )}
    </div>
  );
                                             }
