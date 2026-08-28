'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setLoading(false);
    // Load dark mode from localStorage
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Provide toggle to children via context (or you can pass it via a global store)
  // For simplicity, we'll put it in a context provider later.

  if (loading) {
    return (
      <html lang="en">
        <body className="flex items-center justify-center h-screen">
          <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-full"></div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <body className={`${inter.className} bg-[var(--bg)] text-[var(--text)] max-w-md mx-auto pb-20`}>
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
