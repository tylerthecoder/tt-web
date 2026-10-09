'use server';

import { openai } from '@ai-sdk/openai';
import { withChatRun } from '@/services/chat-run';
import { requireAuth } from '@/utils/auth';
import { getTT } from '@/utils/utils';
import { createConversation } from './conversation';

async function withChat<T>(
  id: string,
  operation: (conversation: ReturnType<typeof createConversation>) => Promise<T>,
) {
  await requireAuth();
  const tt = await getTT();
  return withChatRun(tt.chats, id, (lease) =>
    operation(createConversation(tt, openai('gpt-5'), lease)),
  );
}

export async function listChats() {
  await requireAuth();
  return (await getTT()).chats.listChats();
}
export async function getChat(chatId: string) {
  await requireAuth();
  return (await getTT()).chats.getChatById(chatId);
}
export async function createChat(title?: string) {
  await requireAuth();
  return (await getTT()).chats.createChat({ title });
}
export async function sendUserMessage(id: string, content: string) {
  return withChat(id, (chat) => chat.send(id, content));
}
export async function approveTool(id: string, index: number) {
  return withChat(id, (chat) => chat.decide(id, index, true));
}
export async function rejectTool(id: string, index: number) {
  return withChat(id, (chat) => chat.decide(id, index, false));
}
export async function continueAfterApprovals(id: string) {
  return withChat(id, (chat) => chat.resume(id));
}

export async function getConversationStatus(id: string) {
  return withChat(id, (chat) => chat.status(id));
}
