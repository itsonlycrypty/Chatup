'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserPlus, FaCheck, FaCamera } from 'react-icons/fa';
import Image from 'next/image';

export default function CreateGroup() {
  const { user } = useAuth();
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [groupPicture, setGroupPicture] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setGroupPicture(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return alert('Group name required');
    if (selectedUsers.length < 2) return alert('Add at least 2 users');
    const groupId = `group_${Date.now()}`;
    const group = {
      id: groupId,
      name: groupName.trim(),
      picture: groupPicture || null,
      members: [...selectedUsers, user.id],
      admins: [user.id], // creator is admin
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      settings: {
        requireApproval: false,   // if true, new members need admin approval
        advancedSecurity: false,  // double security check
        preventMediaShare: false, // prevent sharing images/videos
      },
      type: 'group',
    };
    const data = await fetchData();
    const groups = data.groups || [];
    groups.push(group);
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
      {/* Group Picture */}
      <div className="flex flex-col items-center mb-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer border-2 border-blue-500 flex items-center justify-center"
        >
          {groupPicture ? (
            <Image src={groupPicture} alt="Group" width={96} height={96} className="w-full h-full object-cover" />
          ) : (
            <FaCamera size={32} className="text-gray-400" />
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
        <p className="text-xs text-gray-500 mt-1">Tap to add group picture</p>
      </div>
      <input
        className="w-full bg-gray-100 dark:bg-gray-800 text-[var(--text)] p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <p className="text-gray-500 dark:text-gray-400 mb-2">Select users:</p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
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
