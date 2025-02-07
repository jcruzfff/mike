'use client';

import type { PropsWithChildren } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import * as React from 'react';

interface ClientLayoutProps extends PropsWithChildren {
  isCollapsed: boolean;
}

export function ClientLayout({ children, isCollapsed }: ClientLayoutProps) {
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </SidebarProvider>
  );
} 