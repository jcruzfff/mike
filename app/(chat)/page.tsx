'use client';

import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { usePrivy } from '@privy-io/react-auth';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';

export default function HomePage() {
  const { ready, authenticated } = usePrivy();
  const id = generateUUID();

  if (!ready) {
    return null; // or loading state
  }

  return (
    <>
      <Chat 
        id={id} 
        initialMessages={[]} 
        selectedModelId={DEFAULT_MODEL_NAME}
        selectedVisibilityType="private"
        isReadonly={!authenticated}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
