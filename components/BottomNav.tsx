'use client';
import { usePathname, useRouter } from 'next/navigation';
import { FaComment, FaUser, FaCog } from 'react-icons/fa';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: 'Chat', icon: FaComment, path: '/chat' },
    { name: 'Profile', icon: FaUser, path: '/profile' },
    { name: 'Settings', icon: FaCog, path: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 flex justify-around items-center py-2 z-50">
      {tabs.map(({ name, icon: Icon, path }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/');
        return (
          <button
            key={name}
            onClick={() => router.push(path)}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon size={22} />
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
                }
