'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';

export default function JoinGroup() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const join = async () => {
      if (!user) {
        router.push('/profile');
        return;
      }
      const data = await fetchData();
      const groups = data.groups || [];
      const idx = groups.findIndex((g: any) => g.id === id);
      if (idx === -1) {
        setError('Group not found');
        setLoading(false);
        return;
      }
      const group = groups[idx];
      if (group.members?.includes(user.id)) {
        router.push(`/chat/${id}`);
        return;
      }
      // Check if group requires admin approval
      if (group.settings?.requireApproval) {
        // Notify admins
        const admins = group.admins || [group.createdBy];
        for (const adminId of admins) {
          const notif = {
            id: `notif_${Date.now()}_${Math.random()}`,
            userId: adminId,
            text: `${user.displayName} requested to join "${group.name}"`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'join_request',
            chatId: id,
          };
          const notifData = await fetchData();
          const notifications = notifData.notifications || [];
          notifications.push(notif);
          await saveData({ ...notifData, notifications });
        }
        setError('Join request sent. Awaiting admin approval.');
        setLoading(false);
        return;
      }
      // Auto-join
      groups[idx].members.push(user.id);
      await saveData({ ...data, groups });
      // Notify creator
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: group.createdBy,
        text: `${user.displayName} joined the group "${group.name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'group_join',
        chatId: id,
      };
      const notifData = await fetchData();
      const notifications = notifData.notifications || [];
      notifications.push(notif);
      await saveData({ ...notifData, notifications });
      router.push(`/chat/${id}`);
    };
    join();
  }, [id, user, router]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[var(--bg)]"><div className="animate-spin h-12 w-12 border-t-4 border-b-4 border-blue-500 rounded-full" /></div>;
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg)] p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm text-center">
        <h1 className="text-2xl font-bold text-white">Join Group</h1>
        {error ? <p className="text-yellow-400 mt-4">{error}</p> : <p className="text-white mt-4">Processing...</p>}
      </div>
    </div>
  );
          }
