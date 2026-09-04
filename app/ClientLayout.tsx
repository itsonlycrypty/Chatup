'use client';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <>
      {children}
      {user && <BottomNav />}
    </>
  );
}
