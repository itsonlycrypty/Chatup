'use client';
import { usePathname, useRouter } from 'next/navigation';
import { FaComment, FaUser, FaCog, FaAddressBook } from 'react-icons/fa';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: 'Chats', icon: FaComment, path: '/chat' },
    { name: 'Contacts', icon: FaAddressBook, path: '/contacts' },
    { name: 'Settings', icon: FaCog, path: '/settings' },
    { name: 'Profile', icon: FaUser, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#17212b] border-t border-[#101921] flex justify-around items-center py-2 z-50">
      {tabs.map(({ name, icon: Icon, path }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/');
        return (
          <button
            key={name}
            onClick={() => router.push(path)}
            className={`flex flex-col items-center gap-0.5 text-[11px] transition ${
              isActive ? 'text-[#5288c1]' : 'text-[#7f91a4]'
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
