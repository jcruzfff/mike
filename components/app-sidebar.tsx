'use client';

import Link from 'next/link';
import * as React from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SidebarHistory } from '@/components/sidebar-history';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onSelect?: () => void;
}

export function AppSidebar({ onSelect }: AppSidebarProps) {
  const { state, open, toggleSidebar } = useSidebar();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const primaryWallet = wallets?.[0];

  // Move the development logging into an effect to prevent it from running on every render
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sidebar State:', {
        state,
        open,
        wallet: !!primaryWallet,
        authenticated
      });
    }
  }, [state, open, primaryWallet, authenticated]);

  // Memoize the content to prevent unnecessary re-renders
  const content = React.useMemo(() => {
    if (!open) {
      return null;
    }

    return (
      <>
        <div 
          className={cn(
            "absolute z-10 left-[10%] top-[10vh] w-[306px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] overflow-hidden backdrop-blur-sm",
            "max-[1140px]:top-[16vh] max-[1140px]:w-[90%] max-[1140px]:left-[5%] max-[1140px]:rounded-[32px] max-[1140px]:border-[0.5px] max-[1140px]:bg-[rgba(33,13,62,0.91)]",
            "max-[600px]:fixed max-[600px]:inset-0 max-[600px]:bottom-0 max-[600px]:left-0 max-[600px]:w-full max-[600px]:h-screen max-[600px]:z-[999999] max-[600px]:rounded-none max-[600px]:border-0 max-[600px]:bg-[#160B18] max-[600px]:translate-x-full max-[600px]:transition-transform max-[600px]:duration-300",
            open && "max-[600px]:translate-x-0"
          )}
        >
          <div className="flex flex-col h-[440px] max-[1140px]:h-[240px] max-[600px]:h-full ">
            <div className="shrink-0 p-4 border-b border-[#3F1E3E] flex justify-between items-center">
              <span className="text-lg font-semibold px-2 text-white/90">
                History
              </span>
              <button 
                onClick={toggleSidebar}
                className="p-2 text-white/90 hover:text-white rounded-md cursor-pointer max-[600px]:block hidden"
              >
                <Cross2Icon className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#3F1E3E] scrollbar-track-transparent">
              <React.Suspense fallback={null}>
                <SidebarHistory 
                  user={authenticated && primaryWallet ? {
                    id: primaryWallet.address,
                    address: primaryWallet.address
                  } : undefined} 
                  onSelect={toggleSidebar} 
                />
              </React.Suspense>
            </div>
          </div>
        </div>
        
        {/* Overlay backdrop for mobile */}
        {open && (
          <div 
            className="fixed inset-0 bg-black/50 z-[999998] hidden max-[600px]:block"
            onClick={toggleSidebar}
          />
        )}
      </>
    );
  }, [open, authenticated, primaryWallet, toggleSidebar]);

  return content;
}
