'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchData, saveData } from '@/lib/db';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const ensureOfficialChannel = async () => {
      if (!user) return;
      const data = await fetchData();
      const channels = data.channels || [];
      const official = channels.find((c: any) => c.isOfficial === true);
      if (!official) {
        // Create official channel if it doesn't exist
        const users = data.users || [];
        const adminUser = users.find((u: any) => u.isVerified === true && u.username === 'Onlycrypty');
        if (adminUser) {
          const newChannel = {
            id: `official_${Date.now()}`,
            name: 'Chat Up Official',
            description: 'Official announcements from Chat Up',
            picture: null,
            owner: adminUser.id,
            admins: [adminUser.id],
            members: users.map((u: any) => u.id), // all users
            isOfficial: true,
            onlyAdminsCanSend: true,
            createdAt: new Date().toISOString(),
            type: 'channel',
          };
          channels.push(newChannel);
          const chats = data.chats || {};
          chats[newChannel.id] = [];
          await saveData({ ...data, channels, chats });
          console.log('Official channel created.');
        }
      }
    };

    if (!loading) {
      if (user) {
        ensureOfficialChannel();
        router.push('/feed');
      } else {
        router.push('/profile');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
      <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
    </div>
  );
            }
