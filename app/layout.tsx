import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/context/AuthContext';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat Up',
  description: 'Chat with friends and share moments',
};

// We need a client component wrapper to access auth context
// Let's create a separate ClientLayout component.
// For simplicity, I'll modify the layout to use a client wrapper.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
