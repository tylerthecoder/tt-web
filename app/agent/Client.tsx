'use client'

import { useEffect, useState, useTransition } from 'react';
import { approveTool, createChat, getChat, listChats, rejectTool, sendUserMessage, getPendingApprovals } from './actions';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant' | 'tool' | 'system';
    content: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
};

type Chat = {
    id: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
    state?: unknown;
};

type ApprovalPreview = { index: number; name: string; args: Record<string, any> };

export default function Client({ initialChat, initialChats }: { initialChat: Chat, initialChats: Chat[] }) {
    const [chat, setChat] = useState<Chat>(initialChat);
    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [input, setInput] = useState('');
    const [isPending, startTransition] = useTransition();
    const [approvals, setApprovals] = useState<ApprovalPreview[]>([]);

    useEffect(() => {
        // Load pending approvals if any when a chat is selected
        startTransition(async () => {
            const res = await getPendingApprovals(chat.id);
            setApprovals(res || []);
        });
    }, [chat.id]);

    const onSend = () => {
        if (!input.trim()) return;
        const content = input.trim();
        setInput('');
        startTransition(async () => {
            const result = await sendUserMessage(chat.id, content);
            if (result.done) {
                setChat(result.chat as Chat);
                setApprovals([]);
            } else {
                // Interruptions: show approvals; chat already has the user message persisted
                setApprovals(result.approvals || []);
            }
            const freshList = await listChats();
            setChats(freshList as Chat[]);
        });
    };

    const onNewChat = () => {
        startTransition(async () => {
            const c = await createChat('New Chat');
            setChat(c as Chat);
            const freshList = await listChats();
            setChats(freshList as Chat[]);
            setApprovals([]);
        });
    };

    const onSelectChat = (id: string) => {
        startTransition(async () => {
            const c = await getChat(id);
            if (c) setChat(c as Chat);
            const res = await getPendingApprovals(id);
            setApprovals(res || []);
        });
    };

    const onApprove = (index: number) => {
        startTransition(async () => {
            const res = await approveTool(chat.id, index);
            if (res.done && res.chat) {
                setChat(res.chat as Chat);
                setApprovals([]);
            } else {
                setApprovals(res.approvals || []);
            }
        });
    };

    const onReject = (index: number) => {
        startTransition(async () => {
            const res = await rejectTool(chat.id, index);
            if (res.done && res.chat) {
                setChat(res.chat as Chat);
                setApprovals([]);
            } else {
                setApprovals(res.approvals || []);
            }
        });
    };

    return (
        <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 space-y-2">
                <button onClick={onNewChat} className="w-full py-2 px-3 rounded bg-blue-600 text-white disabled:opacity-50" disabled={isPending}>
                    New chat
                </button>
                <div className="space-y-1">
                    {chats.map((c: Chat) => (
                        <button key={c.id} onClick={() => onSelectChat(c.id)} className={`w-full text-left px-3 py-2 rounded ${c.id === chat.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                            {c.title || 'Untitled'}
                            <div className="text-xs text-gray-500">{new Date(c.updatedAt).toLocaleString()}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="col-span-3 flex flex-col h-[70vh] border rounded">
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {chat.messages.map((m: ChatMessage) => (
                        <div key={m.id} className={`p-3 rounded ${m.role === 'user' ? 'bg-gray-100' : 'bg-green-50'}`}>
                            <div className="text-xs uppercase text-gray-500 mb-1">{m.role}</div>
                            <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                    ))}
                    {approvals.length > 0 && (
                        <div className="mt-2 border rounded p-3 bg-yellow-50">
                            <div className="font-semibold mb-2">Tool approval required</div>
                            <div className="space-y-2">
                                {approvals.map((a) => (
                                    <div key={a.index} className="border rounded p-2 bg-white">
                                        <div className="text-sm font-medium">{a.name}</div>
                                        <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">{JSON.stringify(a.args, null, 2)}</pre>
                                        <div className="mt-2 flex gap-2">
                                            <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => onApprove(a.index)}>Approve</button>
                                            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => onReject(a.index)}>Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {isPending && <div className="text-sm text-gray-500">Working...</div>}
                </div>
                <div className="border-t p-3 flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 border rounded px-3 py-2" />
                    <button onClick={onSend} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={isPending || input.trim().length === 0}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}