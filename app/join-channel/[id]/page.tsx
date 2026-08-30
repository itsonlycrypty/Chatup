'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchData, saveData } from '@/lib/db';

export default function JoinChannel() {
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
      const channels = data.channels || [];
      const idx = channels.findIndex((c: any) => c.id === id);
      if (idx === -1) {
        setError('Channel not found');
        setLoading(false);
        return;
      }
      const channel = channels[idx];
      if (channel.members?.includes(user.id)) {
        router.push(`/chat/${id}`);
        return;
      }
      // Auto-join (channels are public)
      channels[idx].members.push(user.id);
      await saveData({ ...data, channels });
      // Notify owner
      const notif = {
        id: `notif_${Date.now()}_${Math.random()}`,
        userId: channel.owner,
        text: `${user.displayName} joined the channel "${channel.name}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'channel_join',
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
        <h1 className="text-2xl font-bold text-white">Join Channel</h1>
        {error ? <p className="text-yellow-400 mt-4">{error}</p> : <p className="text-white mt-4">Processing...</p>}
      </div>
    </div>
  );
                                     }
