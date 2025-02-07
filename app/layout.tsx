import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import * as React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from './providers';
import { Inter } from 'next/font/google'

import './globals.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'Soltar',
  description: 'AI-powered code review for Solana smart contracts',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-[#0A050B]">
        <Providers>
          <TooltipProvider>
            <Toaster position="top-center" />
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
