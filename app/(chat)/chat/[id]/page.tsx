'use client';

import { notFound } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { useEffect, useState, use } from 'react';
import type { Chat as ChatType } from '@/lib/db/schema';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const primaryWallet = wallets?.[0];
  const [chat, setChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!ready || !authenticated || !primaryWallet?.address) return;
      
      try {
        const response = await fetch(`/api/chat?id=${id}`, {
          headers: {
            authorization: `Bearer ${primaryWallet.address}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to load chat');
        }

        const data = await response.json();
        setChat(data.chat);
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to load chat:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, primaryWallet, ready, authenticated]);

  if (!ready || isLoading) {
    return <div>Loading...</div>;
  }

  // Always render the chat component, but control interaction through isReadonly
  return (
    <>
      <Chat
        id={id}
        initialMessages={convertToUIMessages(messages)}
        selectedModelId={DEFAULT_MODEL_NAME}
        selectedVisibilityType="private"
        isReadonly={!authenticated}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
