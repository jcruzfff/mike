'use server';

import { type CoreUserMessage, generateText, Message, CreateMessage, ChatRequestOptions } from 'ai';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { message } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { customModel } from '@/lib/ai';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import { VisibilityType } from '@/components/visibility-selector';

// Create a new postgres client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: customModel('gpt-4o-mini'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({
  id,
}: {
  id: string;
}): Promise<void> {
  await db.delete(message).where(eq(message.id, id));
  revalidatePath('/chat/[id]', 'page');
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function setModeAction(mode: 'view' | 'edit'): Promise<void> {
  'use server';
  // Mode is handled client-side, so we just need to return
  return Promise.resolve();
}

export async function setMessagesAction(messages: Message[] | ((messages: Message[]) => Message[])): Promise<void> {
  'use server';
  return Promise.resolve();
}

export async function reloadAction(chatRequestOptions?: any): Promise<string | null | undefined> {
  'use server';
  // Reload is handled through the useChat hook, so we just need to return
  revalidatePath('/chat/[id]', 'page');
  return Promise.resolve(null);
}

export async function onApplyAction(): Promise<void> {
  'use server';
  // Handle suggestion application
  revalidatePath('/chat/[id]', 'page');
  return Promise.resolve();
}

export async function setSelectedToolAction(tool: string | null): Promise<void> {
  'use server';
  return Promise.resolve();
}

export async function appendAction(
  message: Message | CreateMessage,
  chatRequestOptions?: ChatRequestOptions,
): Promise<string | null | undefined> {
  'use server';
  revalidatePath('/chat/[id]', 'page');
  return Promise.resolve(null);
}

export async function setIsToolbarVisibleAction(visible: boolean): Promise<void> {
  'use server';
  return Promise.resolve();
}

export async function stopAction(): Promise<void> {
  'use server';
  return Promise.resolve();
}

export async function handleVersionChangeAction(type: 'next' | 'prev' | 'toggle' | 'latest'): Promise<void> {
  'use server';
  revalidatePath('/chat/[id]', 'page');
  return Promise.resolve();
}
