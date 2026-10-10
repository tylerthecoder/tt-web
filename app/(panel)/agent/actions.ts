'use server';

import {
  type Agent,
  type RunResult,
  RunState,
  type RunToolApprovalItem,
  run,
} from '@openai/agents';
import { makeAgent } from 'tt-services';
import { withChatRun } from '@/services/chat-run';

import { requireAuth } from '@/utils/auth';
import { getTT } from '@/utils/utils';

async function getAgent(): Promise<Agent> {
  const tt = await getTT();
  return makeAgent(tt);
}

// Helper to format approval item details for UI
function formatApprovalItemDisplay(item: RunToolApprovalItem): {
  name: string;
  args: Record<string, any>;
} {
  const anyItem: any = item as any;

  // Prefer toJSON if present (SDK class instance)
  const json = typeof anyItem?.toJSON === 'function' ? anyItem.toJSON() : anyItem;

  const raw = json?.rawItem ?? json?.raw_item ?? {};
  const name: string = typeof raw?.name === 'string' ? raw.name : '';

  let args: Record<string, any> = {};
  const rawArgs = (raw as any)?.arguments;

  try {
    if (typeof rawArgs === 'string') {
      args = JSON.parse(rawArgs);
    } else if (rawArgs && typeof rawArgs === 'object') {
      args = rawArgs as Record<string, any>;
    }
  } catch {
    args = {};
  }

  return { name, args };
}

export async function listChats() {
  await requireAuth();
  const tt = await getTT();
  return tt.chats.listChats();
}

export async function getChat(chatId: string) {
  await requireAuth();
  const tt = await getTT();
  return tt.chats.getChatById(chatId);
}

export async function createChat(title?: string) {
  await requireAuth();
  const tt = await getTT();
  const chat = await tt.chats.createChat({ title });
  return chat;
}

export type ApprovalPreview = { index: number; name: string; args: Record<string, any> };

async function getApprovalsFromState(state: RunState<any, Agent>): Promise<ApprovalPreview[]> {
  const interruptions = state.getInterruptions();
  const approvals = interruptions.filter((i: any) => i?.type === 'tool_approval_item') as any[];
  return approvals.map((item, idx) => {
    const { name, args } = formatApprovalItemDisplay(item as unknown as RunToolApprovalItem);
    return { index: idx, name, args };
  });
}

export async function getPendingApprovals(chatId: string): Promise<ApprovalPreview[]> {
  await requireAuth();
  const tt = await getTT();
  const coreAgent = await getAgent();
  const chat = await tt.chats.getChatById(chatId);
  if (!chat?.state || typeof chat.state !== 'string') return [];
  const state = await RunState.fromString(coreAgent, chat.state);
  return getApprovalsFromState(state);
}

export async function sendUserMessage(
  chatId: string,
  content: string,
): Promise<{ chat: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  return withChatRun(tt.chats, chatId, async (lease) => {
    const coreAgent = await getAgent();
    const existing = await tt.chats.getChatById(chatId);
    if (existing?.state && typeof existing.state !== 'string') {
      throw new Error('This chat belongs to AI Chat. Continue it on /ai.');
    }
    // Append user message first
    await lease.assertOwned();
    let chat = await tt.chats.commitRun(chatId, lease.token, existing?.state, [
      { role: 'user', content },
    ]);

    // Build prompt from conversation
    const historyText = (chat.messages as Array<{ role: string; content: string }>)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const result: RunResult<any, any> = await run(coreAgent, historyText, {
      signal: lease.signal,
    });

    if (result.interruptions.length === 0) {
      const assistantOutput =
        typeof result.finalOutput === 'string'
          ? result.finalOutput
          : JSON.stringify(result.finalOutput);
      chat = await tt.chats.commitRun(chatId, lease.token, undefined, [
        { role: 'assistant', content: assistantOutput },
      ]);
      return { chat, done: true };
    }

    // Persist run state and return approvals for UI
    const stateStr = result.state.toString();
    await tt.chats.commitRun(chatId, lease.token, stateStr);
    const approvals = await getApprovalsFromState(result.state as RunState<any, any>);
    return { chat, done: false, approvals };
  });
}

export async function approveTool(
  chatId: string,
  approvalIndex: number,
  alwaysApprove = false,
): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  return withChatRun(tt.chats, chatId, async (lease) => {
    const coreAgent = await getAgent();
    const chat = await tt.chats.getChatById(chatId);
    if (!chat?.state || typeof chat.state !== 'string') return { done: true };

    const state = await RunState.fromString(coreAgent, chat.state);
    const interruptions = state.getInterruptions();
    const approvals = interruptions.filter(
      (i: any) => i?.type === 'tool_approval_item',
    ) as any[];
    const item = approvals[approvalIndex] as any;
    if (!item) return { done: true };

    // Approve using RunState instance
    (state as any).approve(item, { alwaysApprove });
    await lease.assertOwned();
    const result: RunResult<any, any> = await run(coreAgent, state, { signal: lease.signal });

    if (result.interruptions.length === 0) {
      // Append final output and clear state
      const assistantOutput =
        typeof result.finalOutput === 'string'
          ? result.finalOutput
          : JSON.stringify(result.finalOutput);
      const updated = await tt.chats.commitRun(chatId, lease.token, undefined, [
        { role: 'assistant', content: assistantOutput },
      ]);
      return { chat: updated, done: true };
    } else {
      // Save updated state and return approvals again
      await tt.chats.commitRun(chatId, lease.token, result.state.toString());
      const approvals = await getApprovalsFromState(result.state as RunState<any, any>);
      return { done: false, approvals };
    }
  });
}

export async function rejectTool(
  chatId: string,
  approvalIndex: number,
  alwaysReject = false,
): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  return withChatRun(tt.chats, chatId, async (lease) => {
    const coreAgent = await getAgent();
    const chat = await tt.chats.getChatById(chatId);
    if (!chat?.state || typeof chat.state !== 'string') return { done: true };

    const state = await RunState.fromString(coreAgent, chat.state);
    const interruptions = state.getInterruptions();
    const approvals = interruptions.filter(
      (i: any) => i?.type === 'tool_approval_item',
    ) as any[];
    const item = approvals[approvalIndex] as any;
    if (!item) return { done: true };

    (state as any).reject(item, { alwaysReject });
    await lease.assertOwned();
    const result: RunResult<any, any> = await run(coreAgent, state, { signal: lease.signal });

    if (result.interruptions.length === 0) {
      const assistantOutput =
        typeof result.finalOutput === 'string'
          ? result.finalOutput
          : JSON.stringify(result.finalOutput);
      const updated = await tt.chats.commitRun(chatId, lease.token, undefined, [
        { role: 'assistant', content: assistantOutput },
      ]);
      return { chat: updated, done: true };
    } else {
      await tt.chats.commitRun(chatId, lease.token, result.state.toString());
      const approvals = await getApprovalsFromState(result.state as RunState<any, any>);
      return { done: false, approvals };
    }
  });
}
