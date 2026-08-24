'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) router.push('/feed');
      else router.push('/profile');
    }
  }, [user, loading, router]);

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}
