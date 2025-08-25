'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { Chat } from 'tt-services';
import { z } from 'zod';

import { requireAuth } from '@/utils/auth';
import { baseLogger } from '@/utils/logger';
import { getTT } from '@/utils/utils';

const logger = baseLogger.child({ module: 'ai-actions' });

// Provider/model selection
const model = openai('gpt-5');

// Tool names available to the AI
const TOOL_NAMES = [
  'get_note',
  'get_all_notes_metadata',
  'get_notes_by_ids',
  'update_note_tags',
] as const;
type ToolName = (typeof TOOL_NAMES)[number];

// Shapes for each tool
const ToolArgsByName: Record<ToolName, z.ZodTypeAny> = {
  get_note: z.object({ id: z.string() }).strict(),
  get_all_notes_metadata: z.object({}).strict(),
  get_notes_by_ids: z.object({ ids: z.array(z.string()).min(1) }).strict(),
  update_note_tags: z
    .object({ noteId: z.string(), tags: z.array(z.string()) })
    .strict(),
};

const ToolProposalSchema = z.object({
  name: z.enum(TOOL_NAMES as unknown as [ToolName, ...ToolName[]]),
  args: z.record(z.any()),
});

// Use a single object schema (providers often require top-level object JSON schema)
const AiResponseSchema = z
  .object({
    type: z.enum(['assistant', 'tool_proposals'] as const),
    content: z.string().optional(),
    tools: z.array(ToolProposalSchema).min(1).optional(),
  })
  .strict();

type AiAssistantResponse = z.infer<typeof AiResponseSchema>;

type ApprovalPreview = { index: number; name: ToolName; args: Record<string, any> };

function buildSystemPrompt() {
  return [
    'You are an AI assistant for Tyler. You can propose tool calls when needed.',
    'Tools available:',
    '- get_note(id: string): Get a note by id.',
    '- get_all_notes_metadata(): Get all notes metadata.',
    '- get_notes_by_ids(ids: string[]): Get multiple notes by ids.',
    '- update_note_tags(noteId: string, tags: string[]): Update a note\'s tags (destructive).',
    'Policy:',
    '- If you can answer directly from prior messages, return {"type":"assistant","content":"..."}.',
    '- If you need external data or to change notes, return {"type":"tool_proposals","tools":[{name, args}, ...]}.',
    '- Do NOT execute tools yourself. Only propose calls with strictly valid args.',
    '- Prefer the fewest tool calls necessary to answer the user.',
  ].join('\n');
}

function buildHistoryPrompt(chat: Chat): string {
  return (chat.messages as Array<{ role: string; content: string }>)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');
}

function validateToolArgs(name: ToolName, args: Record<string, any>) {
  const schema = ToolArgsByName[name];
  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid args for ${name}: ${parsed.error.message}`);
  }
  return parsed.data as any;
}

// Persist and retrieve pending approvals in chat.state
function getPendingFromState(chat: Chat): ApprovalPreview[] {
  const state = (chat.state ?? {}) as any;
  const pending: Array<{ name: ToolName; args: Record<string, any> }> =
    Array.isArray(state?.pendingTools) ? state.pendingTools : [];
  return pending.map((t, index) => ({ index, name: t.name, args: t.args }));
}

async function setPendingState(chatId: string, tools: ApprovalPreview[]) {
  const tt = await getTT();
  const pendingTools = tools.map((t) => ({ name: t.name, args: t.args }));
  await tt.chats.updateState(chatId, { pendingTools });
}

async function clearState(chatId: string) {
  const tt = await getTT();
  await tt.chats.updateState(chatId, undefined);
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

export async function getPendingApprovals(chatId: string): Promise<ApprovalPreview[]> {
  await requireAuth();
  const tt = await getTT();
  const chat = await tt.chats.getChatById(chatId);
  if (!chat) return [];
  return getPendingFromState(chat);
}

export async function getNoteMetadata(noteId: string) {
  await requireAuth();
  const tt = await getTT();
  return tt.notes.getNoteMetadataById(noteId);
}

export async function sendUserMessage(
  chatId: string,
  content: string,
): Promise<{ chat: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  let chat = await tt.chats.appendMessage(chatId, { role: 'user', content });

  const system = buildSystemPrompt();
  const prompt = buildHistoryPrompt(chat);

  const { object } = await generateObject({
    model,
    system,
    prompt,
    schema: AiResponseSchema,
  });

  const parsed = object as AiAssistantResponse;
  if (parsed.type === 'assistant') {
    const contentOut = typeof parsed.content === 'string' ? parsed.content : '';
    chat = await tt.chats.appendMessage(chatId, { role: 'assistant', content: contentOut });
    await clearState(chatId);
    return { chat, done: true };
  }

  // Handle tool proposals: auto-run safe tools, request approval for updates
  const proposed = Array.isArray(parsed.tools) ? parsed.tools : [];
  const result = await handleProposals(chatId, proposed);
  if ('chat' in result) {
    return { chat: result.chat, done: true };
  } else if ('approvals' in result) {
    return { chat, done: false, approvals: result.approvals };
  }
  // Fallback (should not happen)
  return { chat, done: true };
}

async function executeTool(chatId: string, tool: ApprovalPreview) {
  logger.info({ tool }, 'Executing tool');
  const tt = await getTT();
  switch (tool.name) {
    case 'get_note': {
      const args = validateToolArgs('get_note', tool.args) as { id: string };
      const note = await tt.notes.getNoteById(args.id);
      const content = JSON.stringify({ tool: tool.name, args, result: note });
      return tt.chats.appendMessage(chatId, { role: 'tool', content });
    }
    case 'get_all_notes_metadata': {
      const args = validateToolArgs('get_all_notes_metadata', tool.args) as {};
      const notes = await tt.notes.getAllNotesMetadata();
      const content = JSON.stringify({ tool: tool.name, args, result: notes });
      return tt.chats.appendMessage(chatId, { role: 'tool', content });
    }
    case 'get_notes_by_ids': {
      const args = validateToolArgs('get_notes_by_ids', tool.args) as { ids: string[] };
      const notes = await tt.notes.getNotesByIds(args.ids);
      const content = JSON.stringify({ tool: tool.name, args, result: notes });
      return tt.chats.appendMessage(chatId, { role: 'tool', content });
    }
    case 'update_note_tags': {
      const args = validateToolArgs('update_note_tags', tool.args) as { noteId: string; tags: string[] };
      const note = await tt.notes.updateNote(args.noteId, { tags: args.tags });
      const content = JSON.stringify({ tool: tool.name, args, result: note });
      return tt.chats.appendMessage(chatId, { role: 'tool', content });
    }
  }
}

const AUTO_TOOLS: ReadonlyArray<ToolName> = [
  'get_note',
  'get_all_notes_metadata',
  'get_notes_by_ids',
] as const;

function splitProposals(proposals: Array<{ name: ToolName; args: Record<string, any> }>) {
  const auto: ApprovalPreview[] = [];
  const approval: ApprovalPreview[] = [];
  proposals.forEach((p, idx) => {
    const item: ApprovalPreview = { index: idx, name: p.name, args: p.args };
    if ((AUTO_TOOLS as ReadonlyArray<string>).includes(p.name)) auto.push(item);
    else approval.push(item);
  });
  return { auto, approval };
}

async function executeToolsSequentially(chatId: string, tools: ApprovalPreview[]) {
  for (const t of tools) {
    await executeTool(chatId, t);
  }
}

async function handleProposals(
  chatId: string,
  proposals: Array<{ name: ToolName; args: Record<string, any> }>,
): Promise<{ chat: any } | { approvals: ApprovalPreview[] }> {
  const { auto, approval } = splitProposals(proposals);
  if (auto.length > 0) {
    await executeToolsSequentially(chatId, auto);
  }
  if (approval.length > 0) {
    await setPendingState(chatId, approval);
    return { approvals: approval };
  }
  // No approvals left; continue conversation
  const next = await continueAfterTools(chatId);
  return next;
}

async function continueAfterTools(chatId: string) {
  const tt = await getTT();
  const chat = await tt.chats.getChatById(chatId);
  if (!chat) throw new Error('Chat not found');

  const system = buildSystemPrompt();
  const prompt = buildHistoryPrompt(chat);
  const { object } = await generateObject({ model, system, prompt, schema: AiResponseSchema });
  const parsed = object as AiAssistantResponse;

  if (parsed.type === 'assistant') {
    const contentOut = typeof parsed.content === 'string' ? parsed.content : '';
    const updated = await tt.chats.appendMessage(chatId, { role: 'assistant', content: contentOut });
    await clearState(chatId);
    return { chat: updated, done: true } as const;
  } else {
    const proposed = Array.isArray(parsed.tools) ? parsed.tools : [];
    // Delegate to handler to auto-run safe tools and surface approvals
    const res = await handleProposals(chatId, proposed);
    return res as any;
  }
}

export async function approveTool(
  chatId: string,
  approvalIndex: number,
  _alwaysApprove = false,
): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  const chat = await tt.chats.getChatById(chatId);
  if (!chat) return { done: true };

  const pending = getPendingFromState(chat);
  const item = pending[approvalIndex];
  if (!item) return { done: true };

  await executeTool(chatId, item);

  // Remove the approved item from pending and, if any remain, do NOT continue yet
  const remainingRaw = pending.filter((_, idx) => idx !== approvalIndex);
  if (remainingRaw.length > 0) {
    const remaining: ApprovalPreview[] = remainingRaw.map((t, idx) => ({ index: idx, name: t.name, args: t.args }));
    await setPendingState(chatId, remaining);
    return { done: false, approvals: remaining };
  }

  // No approvals left; now continue the conversation
  const result = await continueAfterTools(chatId);
  if (result.done) {
    return { chat: result.chat, done: true };
  } else {
    return { done: false, approvals: result.approvals };
  }
}

export async function rejectTool(
  chatId: string,
  approvalIndex: number,
  _alwaysReject = false,
): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
  await requireAuth();
  const tt = await getTT();
  const chat = await tt.chats.getChatById(chatId);
  if (!chat) return { done: true };

  const pending = getPendingFromState(chat);
  const item = pending[approvalIndex];
  if (!item) return { done: true };

  // Record a system message noting the rejection for model context
  const rejectionNote = `Tool call rejected: ${item.name} ${JSON.stringify(item.args)}`;
  await tt.chats.appendMessage(chatId, { role: 'system', content: rejectionNote });

  // Remove the rejected item; if any approvals remain, do NOT continue yet
  const remainingRaw = pending.filter((_, idx) => idx !== approvalIndex);
  if (remainingRaw.length > 0) {
    const remaining: ApprovalPreview[] = remainingRaw.map((t, idx) => ({ index: idx, name: t.name, args: t.args }));
    await setPendingState(chatId, remaining);
    return { done: false, approvals: remaining };
  }

  // No approvals left; now continue the conversation
  const result = await continueAfterTools(chatId);
  if (result.done) {
    return { chat: result.chat, done: true };
  } else {
    return { done: false, approvals: result.approvals };
  }
}


