'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { cn, fetcher } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onSelect: (chatId: string) => void;
}

const PureChatItem = React.forwardRef<HTMLLIElement, ChatItemProps>(
  ({ chat, isActive, onDelete, onSelect }, ref) => {
    const { visibilityType, setVisibilityType } = useChatVisibility({
      chatId: chat.id,
      initialVisibility: chat.visibility,
    });

    return (
      <li ref={ref} className="group/menu-item relative">
        <div className="flex items-center">
          <Link
            href={`/chat/${chat.id}`}
            onClick={() => onSelect(chat.id)}
            className={cn(
              'flex-1 truncate px-3 py-2 rounded-[19.125px] transition-colors',
              isActive 
                ? 'bg-[rgba(33,13,62,0.60)] text-white border-[1.125px] border-[#3F1E3E]' 
                : 'hover:bg-[rgba(33,13,62,0.45)] text-white/80 hover:text-white'
            )}
          >
            <span>{chat.title}</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mr-0.5 p-1 hover:bg-[rgba(33,13,62,0.45)] text-white/80 hover:text-white rounded-md"
                aria-label="More options"
              >
                <MoreHorizontalIcon size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="end" className="bg-[rgba(33,13,62,0.90)] border-[#3F1E3E]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer text-white/80 hover:text-white hover:bg-[rgba(33,13,62,0.60)]">
                  <ShareIcon size={16} />
                  <span>Share</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-[rgba(33,13,62,0.90)] border-[#3F1E3E]">
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between text-white/80 hover:text-white hover:bg-[rgba(33,13,62,0.60)]"
                      onClick={() => {
                        setVisibilityType('private');
                      }}
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <LockIcon size={12} />
                        <span>Private</span>
                      </div>
                      {visibilityType === 'private' ? (
                        <CheckCircleFillIcon size={16} />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer flex-row justify-between text-white/80 hover:text-white hover:bg-[rgba(33,13,62,0.60)]"
                      onClick={() => {
                        setVisibilityType('public');
                      }}
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <GlobeIcon size={16} />
                        <span>Public</span>
                      </div>
                      {visibilityType === 'public' ? (
                        <CheckCircleFillIcon size={16} />
                      ) : null}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuItem
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-[rgba(33,13,62,0.60)]"
                onClick={() => onDelete(chat.id)}
              >
                <TrashIcon size={16} />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    );
  }
);

PureChatItem.displayName = 'PureChatItem';

const ChatItem = memo(PureChatItem);

interface PrivyUser {
  id: string;
  address: string;
}

interface SidebarHistoryProps {
  user: PrivyUser | undefined;
}

export const SidebarHistory = React.forwardRef<HTMLDivElement, SidebarHistoryProps & { onSelect?: () => void }>(
  ({ user, onSelect }, ref) => {
    const { id } = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const { wallets } = useWallets();
    const primaryWallet = wallets?.[0];

    const {
      data: history,
      isLoading,
      mutate,
    } = useSWR<Array<Chat>>(
      user && primaryWallet ? {
        url: '/api/history',
        headers: {
          authorization: `Bearer ${primaryWallet.address}`
        }
      } : null, 
      fetcher,
      {
        fallbackData: [],
      }
    );

    useEffect(() => {
      mutate();
    }, [pathname, mutate]);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
      if (!primaryWallet?.address) return;

      const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${primaryWallet.address}`
        }
      });

      toast.promise(deletePromise, {
        loading: 'Deleting chat...',
        success: () => {
          mutate((history) => {
            if (history) {
              return history.filter((h) => h.id !== deleteId);
            }
            return history;
          });
          return 'Chat deleted successfully';
        },
        error: 'Failed to delete chat',
      });

      setShowDeleteDialog(false);

      if (deleteId === id) {
        router.push('/');
      }
    };

    const handleSelect = async (chatId: string) => {
      try {
        // Navigate to the chat
        router.push(`/chat/${chatId}`);
        
        if (onSelect && window.innerWidth <= 600) {
          onSelect();
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
        toast.error('Failed to load chat messages');
      }
    };

    if (!user) {
      return (
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
              Login to save and revisit previous chats!
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    if (isLoading) {
      return (
        <SidebarGroup>
          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
            Today
          </div>
          <SidebarGroupContent>
            <div className="flex flex-col">
              {[44, 32, 28, 64, 52].map((item) => (
                <div
                  key={item}
                  className="rounded-md h-8 flex gap-2 px-2 items-center"
                >
                  <div
                    className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                    style={
                      {
                        '--skeleton-width': `${item}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    if (history?.length === 0) {
      return (
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
              Your conversations will appear here once you start chatting!
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    const groupChatsByDate = (chats: Chat[]): GroupedChats => {
      const now = new Date();
      const oneWeekAgo = subWeeks(now, 1);
      const oneMonthAgo = subMonths(now, 1);

      return chats.reduce(
        (groups, chat) => {
          const chatDate = new Date(chat.createdAt);

          if (isToday(chatDate)) {
            groups.today.push(chat);
          } else if (isYesterday(chatDate)) {
            groups.yesterday.push(chat);
          } else if (chatDate > oneWeekAgo) {
            groups.lastWeek.push(chat);
          } else if (chatDate > oneMonthAgo) {
            groups.lastMonth.push(chat);
          } else {
            groups.older.push(chat);
          }

          return groups;
        },
        {
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          older: [],
        } as GroupedChats,
      );
    };

    return (
      <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {history &&
                (() => {
                  const groupedChats = groupChatsByDate(history);

                  return (
                    <>
                      {groupedChats.today.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                            Today
                          </div>
                          {groupedChats.today.map((chat) => (
                            <PureChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}

                      {groupedChats.yesterday.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                            Yesterday
                          </div>
                          {groupedChats.yesterday.map((chat) => (
                            <PureChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}

                      {groupedChats.lastWeek.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                            Last 7 days
                          </div>
                          {groupedChats.lastWeek.map((chat) => (
                            <PureChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}

                      {groupedChats.lastMonth.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                            Last 30 days
                          </div>
                          {groupedChats.lastMonth.map((chat) => (
                            <PureChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}

                      {groupedChats.older.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                            Older
                          </div>
                          {groupedChats.older.map((chat) => (
                            <PureChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onSelect={handleSelect}
                            />
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                chat and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

SidebarHistory.displayName = 'SidebarHistory';
