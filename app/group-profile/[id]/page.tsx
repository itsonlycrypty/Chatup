'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserCircle, FaCog, FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaShare, FaBell } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function GroupProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const groups = data.groups || [];
      const found = groups.find((g: any) => g.id === id);
      if (found) {
        setGroup(found);
        const users = data.users || [];
        setAllUsers(users);
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/join-group/${id}`);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const isAdmin = group?.admins?.includes(user?.id) || false;
  const isCreator = group?.createdBy === user?.id;
  const isMember = group?.members?.includes(user?.id);

  // ----- Join group -----
  const joinGroup = async () => {
    if (!user) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    if (!groups[idx].members) groups[idx].members = [];
    if (!groups[idx].members.includes(user.id)) {
      groups[idx].members.push(user.id);
      await saveData({ ...data, groups });
      setGroup(groups[idx]);

      // ----- Notification: User joined -----
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: groups[idx].createdBy, // notify creator
        text: `${user.displayName} joined the group "${groups[idx].name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'group_join',
        chatId: id,
      };
      const notifData = await fetchData();
      const notifications = notifData.notifications || [];
      notifications.push(notif);
      await saveData({ ...notifData, notifications });
    }
  };

  // ----- Add admin -----
  const addAdmin = async (userId: string) => {
    if (!isAdmin) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    if (!groups[idx].admins) groups[idx].admins = [];
    if (!groups[idx].admins.includes(userId)) {
      groups[idx].admins.push(userId);
      await saveData({ ...data, groups });
      setGroup(groups[idx]);

      // ----- Notification: User made admin -----
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: userId,
        text: `You were made an admin of the group "${groups[idx].name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'group_admin',
        chatId: id,
      };
      const notifData = await fetchData();
      const notifications = notifData.notifications || [];
      notifications.push(notif);
      await saveData({ ...notifData, notifications });
    }
  };

  // ----- Remove admin -----
  const removeAdmin = async (userId: string) => {
    if (!isAdmin || userId === group?.createdBy) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    groups[idx].admins = groups[idx].admins.filter((u: string) => u !== userId);
    await saveData({ ...data, groups });
    setGroup(groups[idx]);
  };

  // ----- Remove member -----
  const removeMember = async (userId: string) => {
    if (!isAdmin) return;
    if (userId === group?.createdBy) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    groups[idx].members = groups[idx].members.filter((u: string) => u !== userId);
    groups[idx].admins = groups[idx].admins.filter((u: string) => u !== userId);
    await saveData({ ...data, groups });
    setGroup(groups[idx]);
  };

  // ----- Toggle group setting -----
  const toggleSetting = async (key: string) => {
    if (!isAdmin) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    groups[idx].settings[key] = !groups[idx].settings[key];
    await saveData({ ...data, groups });
    setGroup(groups[idx]);
  };

  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join our group!', text: `Join ${group.name} on Chat Up!`, url: inviteLink });
    } else {
      navigator.clipboard?.writeText(inviteLink).then(() => alert('Invite link copied!'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[var(--bg)]"><div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" /></div>;
  if (!group) return <div className="p-4 text-center text-[var(--text)]">Group not found</div>;

  const membersList = allUsers.filter((u: any) => group.members?.includes(u.id));

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 pb-24">
      <button onClick={() => router.back()} className="text-[var(--text)] hover:text-gray-400 flex items-center gap-2 mb-4">
        <FaArrowLeft /> Back
      </button>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-center">
        {group.picture ? (
          <Image src={group.picture} alt="Group" width={80} height={80} className="rounded-full mx-auto border-2 border-blue-500 object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl font-bold mx-auto">
            {group.name[0].toUpperCase()}
          </div>
        )}
        <h2 className="text-2xl font-bold text-[var(--text)] mt-2">{group.name}</h2>
        <p className="text-gray-500 text-sm">{group.members?.length || 0} members</p>
        {!isMember && (
          <button onClick={joinGroup} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm">
            Join Group
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setShowSettings(true)} className="mt-2 ml-2 text-blue-500 hover:text-blue-400 text-sm">
            <FaCog className="inline mr-1" /> Settings
          </button>
        )}
        <button onClick={shareInvite} className="mt-2 ml-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm">
          <FaShare className="inline mr-1" /> Invite
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-[var(--text)] font-semibold mb-2">Members</h3>
        {membersList.map((u: any) => {
          const isMemberAdmin = group.admins?.includes(u.id);
          return (
            <div key={u.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-2">
              <div className="flex items-center gap-3">
                {u.photoURL ? (
                  <Image src={u.photoURL} alt="Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <FaUserCircle size={32} className="text-gray-400" />
                )}
                <span className="text-[var(--text)]">{u.displayName || u.email}</span>
                {isMemberAdmin && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Admin</span>}
                {u.id === group.createdBy && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">Creator</span>}
              </div>
              {isAdmin && u.id !== user?.id && (
                <div className="flex gap-2">
                  {!isMemberAdmin && (
                    <button onClick={() => addAdmin(u.id)} className="text-green-500 hover:text-green-400" title="Make Admin">
                      <FaUserPlus />
                    </button>
                  )}
                  {isMemberAdmin && u.id !== group.createdBy && (
                    <button onClick={() => removeAdmin(u.id)} className="text-yellow-500 hover:text-yellow-400" title="Remove Admin">
                      <FaUserMinus />
                    </button>
                  )}
                  {u.id !== group.createdBy && (
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

      {/* Settings Modal (unchanged) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white text-xl font-bold mb-4">Group Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">Require Admin Approval</span>
                <button
                  onClick={() => toggleSetting('requireApproval')}
                  className={`px-4 py-1 rounded-full text-sm ${group.settings?.requireApproval ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {group.settings?.requireApproval ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Advanced Security</span>
                <button
                  onClick={() => toggleSetting('advancedSecurity')}
                  className={`px-4 py-1 rounded-full text-sm ${group.settings?.advancedSecurity ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {group.settings?.advancedSecurity ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Prevent Media Sharing</span>
                <button
                  onClick={() => toggleSetting('preventMediaShare')}
                  className={`px-4 py-1 rounded-full text-sm ${group.settings?.preventMediaShare ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {group.settings?.preventMediaShare ? 'On' : 'Off'}
                </button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full bg-red-600 text-white py-2 rounded-xl mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
