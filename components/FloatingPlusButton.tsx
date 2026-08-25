'use client';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';

export default function FloatingPlusButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/upload')}
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-40 transition"
    >
      <FaPlus size={24} />
    </button>
  );
}
