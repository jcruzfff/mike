'use client';

import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { VisibilityType, VisibilitySelector } from './visibility-selector';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background/50 backdrop-blur-sm py-2 items-center px-4 gap-2 border-b border-zinc-800 rounded-t-xl">
      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="text-xs"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
