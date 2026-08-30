'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserCircle, FaCog, FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaShare, FaEdit, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

export default function ChannelProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [channel, setChannel] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const channels = data.channels || [];
      const found = channels.find((c: any) => c.id === id);
      if (found) {
        setChannel(found);
        setNewDescription(found.description || '');
        const users = data.users || [];
        setAllUsers(users);
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/join-channel/${id}`);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const isOwner = channel?.owner === user?.id;
  const isAdmin = channel?.admins?.includes(user?.id) || isOwner;
  const isMember = channel?.members?.includes(user?.id);

  // ----- Join channel -----
  const joinChannel = async () => {
    if (!user) return;
    const data = await fetchData();
    const channels = data.channels || [];
    const idx = channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return;
    if (!channels[idx].members) channels[idx].members = [];
    if (!channels[idx].members.includes(user.id)) {
      channels[idx].members.push(user.id);
      await saveData({ ...data, channels });
      setChannel(channels[idx]);

      // ----- Notification: User joined channel -----
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: channels[idx].owner, // notify owner
        text: `${user.displayName} joined the channel "${channels[idx].name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'channel_join',
        chatId: id,
      };
      const notifData = await fetchData();
      const notifications = notifData.notifications || [];
      notifications.push(notif);
      await saveData({ ...notifData, notifications });
    }
  };

  // ----- Add admin (only owner can add) -----
  const addAdmin = async (userId: string) => {
    if (!isOwner) return;
    const data = await fetchData();
    const channels = data.channels || [];
    const idx = channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return;
    if (!channels[idx].admins) channels[idx].admins = [];
    if (!channels[idx].admins.includes(userId)) {
      channels[idx].admins.push(userId);
      await saveData({ ...data, channels });
      setChannel(channels[idx]);

      // ----- Notification: User made admin -----
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: userId,
        text: `You were made an admin of the channel "${channels[idx].name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'channel_admin',
        chatId: id,
      };
      const notifData = await fetchData();
      const notifications = notifData.notifications || [];
      notifications.push(notif);
      await saveData({ ...notifData, notifications });
    }
  };

  // ----- Remove admin (only owner can remove, cannot remove owner) -----
  const removeAdmin = async (userId: string) => {
    if (!isOwner || userId === channel?.owner) return;
    const data = await fetchData();
    const channels = data.channels || [];
    const idx = channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return;
    channels[idx].admins = channels[idx].admins.filter((u: string) => u !== userId);
    await saveData({ ...data, channels });
    setChannel(channels[idx]);
  };

  // ----- Remove member (only owner can remove) -----
  const removeMember = async (userId: string) => {
    if (!isOwner) return;
    if (userId === channel?.owner) return;
    const data = await fetchData();
    const channels = data.channels || [];
    const idx = channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return;
    channels[idx].members = channels[idx].members.filter((u: string) => u !== userId);
    channels[idx].admins = channels[idx].admins.filter((u: string) => u !== userId);
    await saveData({ ...data, channels });
    setChannel(channels[idx]);
  };

  // ----- Update channel description -----
  const updateDescription = async () => {
    if (!isOwner) return;
    const data = await fetchData();
    const channels = data.channels || [];
    const idx = channels.findIndex((c: any) => c.id === id);
    if (idx === -1) return;
    channels[idx].description = newDescription;
    await saveData({ ...data, channels });
    setChannel(channels[idx]);
    setEditingDescription(false);
  };

  // ----- Share invite link -----
  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join my channel!', text: `Join ${channel.name} on Chat Up!`, url: inviteLink });
    } else {
      navigator.clipboard?.writeText(inviteLink).then(() => alert('Invite link copied!'));
    }
  };

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
        <div className="mt-1">
          {editingDescription ? (
            <div className="flex items-center gap-2 justify-center">
              <input
                className="bg-gray-200 dark:bg-gray-700 text-[var(--text)] p-1 rounded"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <button onClick={updateDescription} className="text-green-500 hover:text-green-400"><FaCheck /></button>
              <button onClick={() => setEditingDescription(false)} className="text-red-500 hover:text-red-400"><FaTimes /></button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {channel.description || 'No description'}
              {isOwner && (
                <button onClick={() => setEditingDescription(true)} className="ml-2 text-blue-500 hover:text-blue-400">
                  <FaEdit size={12} />
                </button>
              )}
            </p>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">{channel.members?.length || 0} members</p>
        {!isMember && (
          <button onClick={joinChannel} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm">
            Join Channel
          </button>
        )}
        {isOwner && (
          <button onClick={() => setShowSettings(true)} className="mt-2 ml-2 text-purple-500 hover:text-purple-400 text-sm">
            <FaCog className="inline mr-1" /> Manage
          </button>
        )}
        <button onClick={shareInvite} className="mt-2 ml-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm">
          <FaShare className="inline mr-1" /> Invite
        </button>
      </div>

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
              {isOwner && u.id !== user?.id && (
                <div className="flex gap-2">
                  {!isMemberAdmin && (
                    <button onClick={() => addAdmin(u.id)} className="text-green-500 hover:text-green-400" title="Make Admin">
                      <FaUserPlus />
                    </button>
                  )}
                  {isMemberAdmin && (
                    <button onClick={() => removeAdmin(u.id)} className="text-yellow-500 hover:text-yellow-400" title="Remove Admin">
                      <FaUserMinus />
                    </button>
                  )}
                  {u.id !== channel.owner && (
                    <button onClick={() => removeMember(u.id)} className="text-red-500 hover:text-red-400" title="Remove Member">
                      <FaTimes />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Settings Modal (only owner) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white text-xl font-bold mb-4">Channel Settings</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Delete channel (only if empty? or just delete)
                  if (confirm('Delete this channel permanently? All messages will be lost.')) {
                    // Implement delete logic
                    alert('Channel deletion not implemented yet.');
                  }
                }}
                className="w-full flex items-center gap-3 bg-red-700 hover:bg-red-600 text-white p-3 rounded-xl transition"
              >
                <FaTrash /> Delete Channel
              </button>
              <button onClick={() => setShowSettings(false)} className="w-full bg-gray-600 text-white py-2 rounded-xl mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
