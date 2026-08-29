'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full mx-auto mb-6"></div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Chat Up</h1>
          <p className="text-gray-400 text-sm mt-2">created by <span className="text-blue-400">Crypty</span> &amp; assisted by <span className="text-purple-400">Mole</span></p>
        </div>
      </div>
    );
  }
  return children;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg)] text-[var(--text)] max-w-md mx-auto pb-20`}>
        <AuthProvider>
          <AppContent>
            {children}
            <BottomNav />
          </AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
