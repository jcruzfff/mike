'use client';
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { usePrivy, useWallets } from '@privy-io/react-auth';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModelSelector } from './model-selector';
import { VisibilitySelector, VisibilityType } from './visibility-selector';

export function SidebarUserNav({ 
  selectedModelId,
  selectedVisibilityType,
  chatId,
  isReadonly,
}: { 
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  chatId: string;
  isReadonly: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const primaryWallet = wallets?.[0];

  if (!authenticated || !primaryWallet) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild className="focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
        <Button 
          variant="outline" 
          className="md:h-[34px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] text-white hover:bg-[rgba(33,13,62,0.45)] hover:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center gap-2"
        >
          <Image
            src={`https://avatar.vercel.sh/${primaryWallet.address}`}
            alt={primaryWallet.address ?? 'Wallet Address'}
            width={16}
            height={16}
            className="rounded-full"
          />
          <span className="truncate max-w-[140px] max-[950px]:hidden">{primaryWallet.address}</span>
          <div className="ml-1">
            <ChevronDown size={16} />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[200px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] backdrop-blur-sm [&>*:hover]:bg-[rgba(33,13,62,0.60)] [&>*:hover]:text-white"
      >
        {/* Credits - Only visible on mobile */}
        <div className="max-[950px]:block hidden px-4 py-2">
          <div className="flex items-center">
            <span className="font-monument text-sm mr-2 text-white/80" style={{ fontFamily: 'monument' }}>CREDITS:</span>
            <span 
              className="font-monument text-lg"
              style={{
                fontFamily: 'monument',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #E7B45A 0.18%, #FFE1AD 48.59%, #E7B45A 99.68%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              250
            </span>
          </div>
        </div>

        {/* Model and Visibility Selectors - Only visible on mobile */}
        {!isReadonly && (
          <div className="max-[950px]:block hidden">
            <DropdownMenuSeparator className="bg-[#3F1E3E]/50" />
            <div className="p-2">
              <ModelSelector
                selectedModelId={selectedModelId}
                className="w-full mb-2"
              />
              <VisibilitySelector
                chatId={chatId}
                selectedVisibilityType={selectedVisibilityType}
                className="w-full"
              />
            </div>
          </div>
        )}

        <DropdownMenuItem
          className="gap-4 group/item flex flex-row justify-between items-center text-white/80 focus:bg-transparent focus:text-white/80"
          onSelect={() => {
            window.open(`https://solscan.io/account/${primaryWallet.address}`, '_blank');
          }}
        >
          View on Solscan
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#3F1E3E]/50" />
        <DropdownMenuItem
          className="gap-4 group/item flex flex-row justify-between items-center text-white/80 focus:bg-transparent focus:text-white/80"
          onSelect={logout}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
