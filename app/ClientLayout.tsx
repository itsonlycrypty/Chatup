'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import SplashScreen from '@/components/SplashScreen';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const hideNav = pathname === '/profile' && false; // keep nav everywhere when logged in

  return (
    <>
      <SplashScreen />
      {children}
      {user && !hideNav && <BottomNav />}
    </>
  );
}
