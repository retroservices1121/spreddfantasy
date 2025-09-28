import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { PrivyProvider } from '@/components/auth/PrivyProvider';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpreadMarkets - Fantasy Prediction Markets',
  description: 'Fantasy-style prediction markets platform with Kalshi integration',
  keywords: ['prediction markets', 'fantasy', 'trading', 'blockchain', 'base'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 min-h-screen`}>
        <PrivyProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </PrivyProvider>
      </body>
    </html>
  );
}
