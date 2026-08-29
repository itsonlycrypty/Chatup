'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserCircle, FaCog, FaUserPlus, FaUserMinus, FaTimes, FaShare } from 'react-icons/fa';
import Image from 'next/image';

export default function ChannelProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const channels = data.channels || [];
      const found = channels.find((c: any) => c.id === id);
      if (found) {
        setChannel(found);
        const users = data.users || [];
        setAllUsers(users);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const isOwner = channel?.owner === user?.id;
  const isAdmin = channel?.admins?.includes(user?.id) || isOwner;

  if (loading) return <div className="flex items-center justify-center h-screen bg-[var(--bg)]"><div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" /></div>;
  if (!channel) return <div className="p-4 text-center text-[var(--text)]">Channel not found</div>;

  const membersList = allUsers.filter((u: any) => channel.members?.includes(u.id));

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 pb-24">
      <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400 flex items-center gap-2 mb-4">
        <FaArrowLeft /> Back
      </button>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-center">
        {channel.picture ? (
          <Image src={channel.picture} alt="Channel" width={80} height={80} className="rounded-full mx-auto border-2 border-purple-500 object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto">
            {channel.name[0].toUpperCase()}
          </div>
        )}
        <h2 className="text-2xl font-bold text-[var(--text)] mt-2">{channel.name}</h2>
        {channel.description && <p className="text-gray-500 text-sm">{channel.description}</p>}
        <p className="text-gray-500 text-sm mt-1">{channel.members?.length || 0} members</p>
        {(isOwner || isAdmin) && (
          <button onClick={() => setShowMembers(!showMembers)} className="mt-2 text-purple-500 hover:text-purple-400 text-sm">
            {showMembers ? 'Hide' : 'View'} Members
          </button>
        )}
        {isOwner && (
          <button className="mt-2 ml-4 text-blue-500 hover:text-blue-400 text-sm">
            <FaCog className="inline mr-1" /> Manage
          </button>
        )}
      </div>

      {showMembers && (isOwner || isAdmin) && (
        <div className="mt-6">
          <h3 className="text-[var(--text)] font-semibold mb-2">Members</h3>
          {membersList.map((u: any) => {
            const isMemberAdmin = channel.admins?.includes(u.id);
            return (
              <div key={u.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-2">
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle size={32} className="text-gray-400" />
                  )}
                  <span className="text-[var(--text)]">{u.displayName || u.email}</span>
                  {isMemberAdmin && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Admin</span>}
                  {u.id === channel.owner && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">Owner</span>}
                </div>
                {(isOwner) && u.id !== user?.id && (
                  <button onClick={() => {/* invite admin logic */}} className="text-green-500 hover:text-green-400">
                    <FaUserPlus />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  }
