'use client';
import { useEffect, useState } from 'react';
import { FaComment } from 'react-icons/fa';

export default function SplashScreen() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed inset-0 bg-[#0e1621] z-[9999] flex flex-col items-center justify-center transition-opacity duration-500">
      <div className="w-24 h-24 rounded-full bg-[#2481cc] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
        <FaComment size={48} className="text-white" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">Chat Up</h1>
      <p className="text-gray-400 text-sm">Connecting you...</p>
      <div className="absolute bottom-10 text-center px-6">
        <p className="text-gray-500 text-xs">
          Created by <span className="text-[#2481cc] font-semibold">Crypty</span> and{' '}
          <span className="text-[#2481cc] font-semibold">Mole</span>
        </p>
        <p className="text-gray-600 text-[10px] mt-1">Hackers Hub</p>
      </div>
    </div>
  );
      }
