'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserPlus, FaCheck } from 'react-icons/fa';
import Image from 'next/image';

export default function CreateGroup() {
  const { user } = useAuth();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const users = data.users || [];
      setAllUsers(users.filter((u: any) => u.id !== user?.id));
    };
    load();
  }, [user]);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) return alert('Group name required');
    if (selectedUsers.length < 2) return alert('Add at least 2 users');
    const groupId = `group_${Date.now()}`;
    const group = {
      id: groupId,
      name: groupName.trim(),
      members: [...selectedUsers, user.id],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      type: 'group',
    };
    const data = await fetchData();
    const groups = data.groups || [];
    groups.push(group);
    await saveData({ ...data, groups });
    // Initialize chat for the group
    const chats = data.chats || {};
    chats[groupId] = [];
    await saveData({ ...data, groups, chats });
    router.push(`/chat/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 pb-24">
      <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400 flex items-center gap-2 mb-4">
        <FaArrowLeft /> Back
      </button>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Create Group</h1>
      <input
        className="w-full bg-gray-100 dark:bg-gray-800 text-[var(--text)] p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <p className="text-gray-500 dark:text-gray-400 mb-2">Select users:</p>
      <div className="space-y-2">
        {allUsers.map((u) => (
          <div
            key={u.id}
            onClick={() => toggleUser(u.id)}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
              selectedUsers.includes(u.id) ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-100 dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {u.photoURL ? (
                <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                  {u.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-[var(--text)]">{u.displayName || u.email}</span>
            </div>
            {selectedUsers.includes(u.id) && <FaCheck className="text-blue-500" />}
          </div>
        ))}
      </div>
      <button
        onClick={createGroup}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl mt-4 transition"
      >
        <FaUserPlus className="inline mr-2" /> Create Group ({selectedUsers.length + 1} members)
      </button>
    </div>
  );
                                             }
