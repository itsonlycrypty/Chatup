'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => setLoading(false), []);

  if (loading) {
    return (
      <html lang="en">
        <body className="bg-black flex items-center justify-center h-screen">
          <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full"></div>
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
