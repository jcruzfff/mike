'use client';

import * as React from 'react';
import { startTransition, useMemo, useOptimistic, useState, memo } from 'react';
import { saveModelId } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { models } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

// Memoize the dropdown menu items
const ModelDropdownItems = memo(({ 
  models, 
  optimisticModelId, 
  onSelect 
}: { 
  models: typeof import('@/lib/ai/models').models,
  optimisticModelId: string,
  onSelect: (modelId: string) => void
}) => {
  return (
    <>
      {models.map((model) => (
        <DropdownMenuItem
          key={model.id}
          onSelect={() => onSelect(model.id)}
          className="gap-4 group/item flex flex-row justify-between items-center text-white/80 data-[active=true]:bg-[rgba(33,13,62,0.60)] data-[active=true]:text-white focus:bg-transparent focus:text-white/80"
          data-active={model.id === optimisticModelId}
        >
          <div className="flex flex-col gap-1 items-start">
            {model.label}
            {model.description && (
              <div className="text-xs text-white/60">
                {model.description}
              </div>
            )}
          </div>
          <div className="text-white opacity-0 group-data-[active=true]/item:opacity-100">
            <CheckCircleFillIcon />
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
});

ModelDropdownItems.displayName = 'ModelDropdownItems';

function PureModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === optimisticModelId),
    [optimisticModelId],
  );

  const handleModelSelect = React.useCallback((modelId: string) => {
    setOpen(false);
    startTransition(() => {
      setOptimisticModelId(modelId);
      saveModelId(modelId);
    });
  }, [setOptimisticModelId]);

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
          className="md:h-[34px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] text-white hover:bg-[rgba(33,13,62,0.45)] hover:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center gap-2"
        >
          <span>{selectedModel?.label}</span>
          <div className="ml-1">
            <ChevronDownIcon size={16} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="min-w-[300px] rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] backdrop-blur-sm [&>*:hover]:bg-[rgba(33,13,62,0.60)] [&>*:hover]:text-white"
      >
        <ModelDropdownItems 
          models={models}
          optimisticModelId={optimisticModelId}
          onSelect={handleModelSelect}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const ModelSelector = memo(PureModelSelector, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
