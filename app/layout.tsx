'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Simulate 10‑15 seconds loading
    const timer = setTimeout(() => setLoading(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <html lang="en">
        <body className="bg-black flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto mb-6"></div>
            <h1 className="text-3xl font-bold text-white">Chat Up</h1>
            <p className="text-gray-400 text-sm mt-2">created by <span className="text-blue-400">crypty</span> &amp; <span className="text-purple-400">Mole</span></p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white max-w-md mx-auto pb-20`}>
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
