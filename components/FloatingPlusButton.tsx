'use client';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';

export default function FloatingPlusButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Only show on profile page
  if (pathname !== '/profile') return null;

  return (
    <button
      onClick={() => router.push('/upload')}
      className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-50"
    >
      <FaPlus size={24} />
    </button>
  );
}
