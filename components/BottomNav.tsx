'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaComments, FaUser } from 'react-icons/fa';

export default function BottomNav() {
  const path = usePathname();
  const links = [
    { href: '/feed', icon: FaHome, label: 'Home' },
    { href: '/chat', icon: FaComments, label: 'Chat' },
    { href: '/profile', icon: FaUser, label: 'Profile' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 flex justify-around items-center py-2 px-2 max-w-md mx-auto z-50">
      {links.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} className="flex flex-col items-center">
          <Icon size={22} className={path === href ? 'text-blue-500' : 'text-gray-400'} />
          <span className={`text-[10px] mt-0.5 ${path === href ? 'text-blue-500' : 'text-gray-400'}`}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
