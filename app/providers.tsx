'use client';

import { PrivyProvider } from './providers/PrivyProvider';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider>
      <AuthProvider>
        <SidebarProvider defaultOpen={false}>
          {children}
        </SidebarProvider>
      </AuthProvider>
    </PrivyProvider>
  );
} 