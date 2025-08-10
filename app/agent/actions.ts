'use server'

import { Agent, run, RunResult, RunState, RunToolApprovalItem } from '@openai/agents';
import { TylersThings, makeAgent } from 'tt-services';
import { requireAuth } from '../utils/auth';

async function getServices(): Promise<TylersThings> {
    return TylersThings.buildAndConnect();
}

async function getAgent(): Promise<Agent> {
    const tt = await getServices();
    return makeAgent(tt);
}

// Helper to format approval item details for UI
function formatApprovalItemDisplay(item: RunToolApprovalItem): { name: string; args: Record<string, any> } {
    const json = item.toJSON();
    const name: string = json.rawItem && 'name' in json.rawItem ? (json.rawItem as any).name : '';
    let args: Record<string, any> = {};
    try {
        args = json.rawItem && 'arguments' in json.rawItem && (json.rawItem as any).arguments
            ? JSON.parse((json.rawItem as any).arguments as string)
            : {};
    } catch {
        args = {};
    }
    return { name, args };
}

export async function listChats() {
    await requireAuth();
    const services = await getServices();
    return services.chats.listChats();
}

export async function getChat(chatId: string) {
    await requireAuth();
    const services = await getServices();
    return services.chats.getChatById(chatId);
}

export async function createChat(title?: string) {
    await requireAuth();
    const services = await getServices();
    const chat = await services.chats.createChat({ title });
    return chat;
}

export type ApprovalPreview = { index: number; name: string; args: Record<string, any> };

async function getApprovalsFromState(state: RunState): Promise<ApprovalPreview[]> {
    const interruptions = state.getInterruptions();
    const approvals = interruptions
        .filter((i) => i.type === 'tool_approval_item') as RunToolApprovalItem[];
    return approvals.map((item, idx) => {
        const { name, args } = formatApprovalItemDisplay(item);
        return { index: idx, name, args };
    });
}

export async function getPendingApprovals(chatId: string): Promise<ApprovalPreview[]> {
    await requireAuth();
    const services = await getServices();
    const coreAgent = await getAgent();
    const chat = await services.chats.getChatById(chatId);
    if (!chat?.state || typeof chat.state !== 'string') return [];
    const state = await RunState.fromString(coreAgent, chat.state);
    return getApprovalsFromState(state);
}

export async function sendUserMessage(chatId: string, content: string): Promise<{ chat: any; done: boolean; approvals?: ApprovalPreview[] }> {
    await requireAuth();
    const services = await getServices();
    const coreAgent = await getAgent();
    // Append user message first
    let chat = await services.chats.appendMessage(chatId, { role: 'user', content });

    // Build prompt from conversation
    const historyText = (chat.messages as Array<{ role: string; content: string }>)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

    let result: RunResult<any, any> = await run(coreAgent, historyText);

    if (result.interruptions.length === 0) {
        const assistantOutput = typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput);
        chat = await services.chats.appendMessage(chatId, { role: 'assistant', content: assistantOutput });
        // Clear any stored state since we're done
        await services.chats.updateState(chatId, undefined);
        return { chat, done: true };
    }

    // Persist run state and return approvals for UI
    const stateStr = result.state.toString();
    await services.chats.updateState(chatId, stateStr);
    const approvals = await getApprovalsFromState(result.state as RunState);
    return { chat, done: false, approvals };
}

export async function approveTool(chatId: string, approvalIndex: number, alwaysApprove = false): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
    await requireAuth();
    const services = await getServices();
    const coreAgent = await getAgent();
    const chat = await services.chats.getChatById(chatId);
    if (!chat?.state || typeof chat.state !== 'string') return { done: true };

    let state = await RunState.fromString(coreAgent, chat.state);
    const interruptions = state.getInterruptions();
    const approvals = interruptions.filter((i) => i.type === 'tool_approval_item') as RunToolApprovalItem[];
    const item = approvals[approvalIndex];
    if (!item) return { done: true };

    state.approve(item, { alwaysApprove });
    let result: RunResult<any, any> = await run(coreAgent, state);

    if (result.interruptions.length === 0) {
        // Append final output and clear state
        const assistantOutput = typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput);
        const updated = await services.chats.appendMessage(chatId, { role: 'assistant', content: assistantOutput });
        await services.chats.updateState(chatId, undefined);
        return { chat: updated, done: true };
    } else {
        // Save updated state and return approvals again
        await services.chats.updateState(chatId, result.state.toString());
        const approvals = await getApprovalsFromState(result.state as RunState);
        return { done: false, approvals };
    }
}

export async function rejectTool(chatId: string, approvalIndex: number, alwaysReject = false): Promise<{ chat?: any; done: boolean; approvals?: ApprovalPreview[] }> {
    await requireAuth();
    const services = await getServices();
    const coreAgent = await getAgent();
    const chat = await services.chats.getChatById(chatId);
    if (!chat?.state || typeof chat.state !== 'string') return { done: true };

    let state = await RunState.fromString(coreAgent, chat.state);
    const interruptions = state.getInterruptions();
    const approvals = interruptions.filter((i) => i.type === 'tool_approval_item') as RunToolApprovalItem[];
    const item = approvals[approvalIndex];
    if (!item) return { done: true };

    state.reject(item, { alwaysReject });
    let result: RunResult<any, any> = await run(coreAgent, state);

    if (result.interruptions.length === 0) {
        const assistantOutput = typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput);
        const updated = await services.chats.appendMessage(chatId, { role: 'assistant', content: assistantOutput });
        await services.chats.updateState(chatId, undefined);
        return { chat: updated, done: true };
    } else {
        await services.chats.updateState(chatId, result.state.toString());
        const approvals = await getApprovalsFromState(result.state as RunState);
        return { done: false, approvals };
    }
}