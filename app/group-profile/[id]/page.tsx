'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';
import { FaArrowLeft, FaUserCircle, FaCog, FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaShare, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchData();
      const groups = data.groups || [];
      const found = groups.find((g: any) => g.id === id);
      if (found) {
        setGroup(found);
        setEditData({
          name: found.name,
          description: found.description || '',
          picture: found.picture || null,
          settings: found.settings || {},
        });
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

  // ---- Join group ----
  const joinGroup = async () => {
    // ... same as before (notifications included)
  };

  // ---- Admin functions ----
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
      // Notification
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

  // ---- Edit group ----
  const saveEdit = async () => {
    if (!isAdmin) return;
    const data = await fetchData();
    const groups = data.groups || [];
    const idx = groups.findIndex((g: any) => g.id === id);
    if (idx === -1) return;
    groups[idx].name = editData.name;
    groups[idx].description = editData.description;
    groups[idx].picture = editData.picture;
    groups[idx].settings = editData.settings;
    await saveData({ ...data, groups });
    setGroup(groups[idx]);
    setShowEdit(false);
  };

  const toggleSetting = (key: string) => {
    setEditData((prev: any) => ({
      ...prev,
      settings: { ...prev.settings, [key]: !prev.settings[key] },
    }));
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
        {group.description && <p className="text-gray-500 text-sm">{group.description}</p>}
        <p className="text-gray-500 text-sm mt-1">{group.members?.length || 0} members</p>
        {!isMember && (
          <button onClick={joinGroup} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm">
            Join Group
          </button>
        )}
        {isAdmin && (
          <>
            <button onClick={() => setShowEdit(true)} className="mt-2 ml-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded-full text-sm">
              <FaEdit className="inline mr-1" /> Edit
            </button>
            <button onClick={() => setShowSettings(true)} className="mt-2 ml-2 text-blue-500 hover:text-blue-400 text-sm">
              <FaCog className="inline mr-1" /> Settings
            </button>
          </>
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

      {/* Edit Group Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center p-4 bg-gray-900 border-b border-gray-700">
            <button onClick={() => setShowEdit(false)} className="text-white hover:text-gray-300 mr-4">
              <FaArrowLeft size={24} />
            </button>
            <h2 className="text-white text-xl font-bold">Edit Group</h2>
            <button onClick={saveEdit} className="ml-auto bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Save</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
                {editData.picture ? (
                  <Image src={editData.picture} alt="Group" width={96} height={96} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-600 text-white">
                    {editData.name?.[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 cursor-pointer border-2 border-black">
                  <FaCamera className="text-white text-xs" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditData({ ...editData, picture: ev.target?.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Group Name</label>
              <input
                className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Description</label>
              <textarea
                className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-semibold mb-2">Settings</h3>
              <div className="flex justify-between items-center">
                <span className="text-white">Require Admin Approval</span>
                <button
                  onClick={() => toggleSetting('requireApproval')}
                  className={`px-4 py-1 rounded-full text-sm ${editData.settings?.requireApproval ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {editData.settings?.requireApproval ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white">Advanced Security</span>
                <button
                  onClick={() => toggleSetting('advancedSecurity')}
                  className={`px-4 py-1 rounded-full text-sm ${editData.settings?.advancedSecurity ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {editData.settings?.advancedSecurity ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white">Prevent Media Sharing</span>
                <button
                  onClick={() => toggleSetting('preventMediaShare')}
                  className={`px-4 py-1 rounded-full text-sm ${editData.settings?.preventMediaShare ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
                >
                  {editData.settings?.preventMediaShare ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (same as before) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-white text-xl font-bold mb-4">Group Settings</h2>
            <div className="space-y-3">
              <button onClick={() => setShowSettings(false)} className="w-full bg-red-600 text-white py-2 rounded-xl mt-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
            }
