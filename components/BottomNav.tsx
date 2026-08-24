'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const path = usePathname();
  const links = [
    { href: '/feed', icon: '🏠', label: 'Feed' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/upload', icon: '➕', label: 'Upload' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-3 max-w-md mx-auto z-50">
      {links.map(({ href, icon, label }) => (
        <Link key={href} href={href} className="flex flex-col items-center">
          <span className="text-2xl">{icon}</span>
          <span className={`text-xs ${path === href ? 'text-blue-500' : 'text-gray-400'}`}>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
