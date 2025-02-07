'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWallets } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';

import { fetcher } from '@/lib/utils';
import * as React from 'react';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';
import { AppSidebar } from './app-sidebar';

interface ChatProps {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: 'public' | 'private';
  isReadonly: boolean;
}

export function Chat({ 
  id, 
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly 
}: ChatProps) {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const { toggleSidebar, open } = useSidebar();
  const { wallets } = useWallets();
  const primaryWallet = wallets?.[0];

  const chatConfig = useMemo(() => ({
    id,
    body: { 
      id,
      modelId: selectedModelId 
    },
    api: '/api/chat',
    experimental_throttle: 100,
    headers: primaryWallet ? {
      authorization: `Bearer ${primaryWallet.address}`
    } : undefined,
    onFinish: () => {
      mutate('/api/history');
    },
  }), [id, primaryWallet, mutate, selectedModelId]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat(chatConfig);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  // Memoize the buttons section
  const buttonsSection = useMemo(() => (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[32px] max-[1140px]:bottom-[72px] flex gap-4 max-[1140px]:flex-col max-[1140px]:w-full max-[1140px]:px-4 max-[1140px]:items-start">
      <React.Suspense fallback={<div className="h-[48px] w-[232px] bg-primary/20 rounded-md animate-pulse max-[1140px]:w-full" />}>
        <Button
          variant="gold"
          onClick={toggleSidebar}
          className="w-[232px] h-[48px] font-monument max-[1140px]:w-full"
        >
          {open ? 'HIDE HISTORY' : 'CHAT HISTORY'}
        </Button>
      </React.Suspense>
      <React.Suspense fallback={<div className="h-[48px] w-[232px] bg-primary/20 rounded-md animate-pulse max-[1140px]:w-full" />}>
        <Button
          variant="gold"
          onClick={() => {
            router.push('/');
            router.refresh();
          }}
          className="w-[232px] h-[48px] font-monument max-[1140px]:w-full"
        >
          <PlusIcon size={16} />
          NEW CHAT
        </Button>
      </React.Suspense>
      <Button
        variant="gold"
        className="w-[232px] h-[48px] font-monument max-[1140px]:w-full"
      >
        TOP UP
      </Button>
    </div>
  ), [toggleSidebar, open, router]);

  return (
    <div className="flex flex-col gap-5 w-full h-[354px] max-[1140px]:h-[300px] max-[1140px]:pt-[4px] max-[1140px]:px-4">
      {/* Messages Container */}
      <div className="h-[158px] max-[1140px]:h-[300px] rounded-[48px] max-[1140px]:rounded-[20px] pl-5 pt-2 max-[1140px]:pt-[14px] border-2 border-[#422041] bg-[#160B18] overflow-hidden flex">
        <div className="absolute py-2">
          <Image 
            src="/images/soltar-hero-small.png" 
            alt="Soltar"
            width={50}
            height={50}
            className="rounded-full"
          />
        </div>
        <Messages
          chatId={id}
          messages={messages}
          isLoading={isLoading}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={false}
        />
      </div>

      {/* Chat Input */}
      <div className="w-4/5 max-[1140px]:w-full h-[48px] mx-auto rounded-[12px] border-2 border-[#F1C578] bg-[#422041] shadow-[inset_0px_0px_32px_-6px_rgba(0,0,0,0.60)]">
        <MultimodalInput
          chatId={id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          append={append}
        />
      </div>

      {/* Bottom Buttons */}
      {buttonsSection}
    </div>
  );
}
