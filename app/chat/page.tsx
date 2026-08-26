'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FaUserCircle, FaSearch, FaPlus, FaUserPlus, FaUserCheck, FaShare, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { fetchData } from '@/lib/db';

export default function ChatList() {
  const { user, allUsers, followUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const loadUsers = async () => {
    const data = await fetchData();
    const all = data.users || [];
    const others = all.filter((u: any) => u.id !== user?.id);
    setUsers(others);
    setFiltered(others);
  };

  useEffect(() => {
    if (user) loadUsers();
  }, [user, allUsers]);

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

  const isFollowing = (userId: string) => {
    if (!user) return false;
    return user.following?.includes(userId) || false;
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?ref=${user?.id || ''}`;
    setInviteLink(link);
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
    <div className="p-4 pb-24 min-h-screen bg-black">
      {/* Header with Plus Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Chats</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
        >
          <FaPlus size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* User List */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">{query ? 'No users found' : 'No other users yet'}</p>
      ) : (
        filtered.map((u) => (
          <div key={u.id} className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl mb-3 transition">
            <Link href={`/chat/${u.id}`} className="flex items-center gap-4 flex-1">
              {u.photoURL ? (
                <Image src={u.photoURL} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <FaUserCircle size={40} className="text-gray-400" />
              )}
              <div>
                <p className="text-white font-semibold">{u.displayName || u.email}</p>
                <p className="text-gray-400 text-sm">@{u.username || ''}</p>
              </div>
            </Link>
            <button
              onClick={() => followUser(u.id)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isFollowing(u.id) ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowing(u.id) ? <FaUserCheck className="inline mr-1" /> : <FaUserPlus className="inline mr-1" />}
              {isFollowing(u.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold text-xl">Connections</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Contacts List (already shown above) – we'll reuse the user list */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {users.slice(0, 10).map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <FaUserCircle size={32} className="text-gray-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-semibold">{u.displayName || u.email}</p>
                      <p className="text-gray-400 text-xs">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => followUser(u.id)}
                    className={`text-xs px-3 py-1 rounded-full transition ${
                      isFollowing(u.id) ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing(u.id) ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
              {users.length === 0 && <p className="text-gray-400 text-center">No users available</p>}
            </div>

            {/* Invite Section */}
            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={generateInviteLink}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <FaShare /> Invite Friends
              </button>
              {inviteLink && (
                <p className="text-gray-400 text-xs mt-2 break-all text-center">Link: {inviteLink}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
