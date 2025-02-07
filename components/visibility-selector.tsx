'use client';

import * as React from 'react';
import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
} from './icons';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

export type VisibilityType = 'private' | 'public';

const visibilities: Array<{
  id: VisibilityType;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only you can access this chat',
    icon: <LockIcon />,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Anyone with the link can access this chat',
    icon: <GlobeIcon />,
  },
];

export function VisibilitySelector({
  chatId,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibility: selectedVisibilityType,
  });

  const selectedVisibility = useMemo(
    () => visibilities.find((visibility) => visibility.id === visibilityType),
    [visibilityType],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          className,
        )}
      >
        <Button
          variant="outline"
          className="flex h-[34px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] text-white hover:bg-[rgba(33,13,62,0.45)] hover:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 items-center gap-2"
        >
          {selectedVisibility?.icon}
          {selectedVisibility?.label}
          <div className="ml-1">
            <div className="size-4">
              <ChevronDownIcon />
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="min-w-[300px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] backdrop-blur-sm [&>*:hover]:bg-[rgba(33,13,62,0.60)] [&>*:hover]:text-white"
      >
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            key={visibility.id}
            onSelect={() => {
              setVisibilityType(visibility.id);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center text-white/80 data-[active=true]:bg-[rgba(33,13,62,0.60)] data-[active=true]:text-white focus:bg-transparent focus:text-white/80"
            data-active={visibility.id === visibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-white/60">
                  {visibility.description}
                </div>
              )}
            </div>
            <div className="text-white opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
