'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import {
  approveTool,
  createChat,
  getChat,
  getPendingApprovals,
  listChats,
  rejectTool,
  sendUserMessage,
} from './actions';

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

export default function Client({
  initialChat,
  initialChats,
}: {
  initialChat: Chat;
  initialChats: Chat[];
}) {
  const [chat, setChat] = useState<Chat>(initialChat);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [approvals, setApprovals] = useState<ApprovalPreview[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    startTransition(async () => {
      const res = await getPendingApprovals(chat.id);
      setApprovals(res || []);
    });
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages.length, approvals.length]);

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
        setApprovals(result.approvals || []);
      }
      const freshList = await listChats();
      setChats(freshList as Chat[]);
      scrollToBottom();
    });
  };

  const onNewChat = () => {
    startTransition(async () => {
      const c = await createChat('New Chat');
      setChat(c as Chat);
      const freshList = await listChats();
      setChats(freshList as Chat[]);
      setApprovals([]);
      scrollToBottom();
    });
  };

  const onSelectChat = (id: string) => {
    startTransition(async () => {
      const c = await getChat(id);
      if (c) setChat(c as Chat);
      const res = await getPendingApprovals(id);
      setApprovals(res || []);
      scrollToBottom();
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
      scrollToBottom();
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
      scrollToBottom();
    });
  };

  return (
    <div className="h-full min-h-0">
      <div className="grid grid-cols-4 gap-3 md:gap-4 h-full min-h-0">
        {/* Sidebar */}
        <div className="col-span-4 md:col-span-1 h-full min-h-0 flex flex-col">
          <div className="flex gap-2">
            <button
              onClick={onNewChat}
              className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              disabled={isPending}
            >
              New chat
            </button>
          </div>
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {chats.map((c: Chat) => (
              <button
                key={c.id}
                onClick={() => onSelectChat(c.id)}
                className={`w-full text-left px-3 py-2 rounded transition ${c.id === chat.id ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-white/5 text-gray-200'}`}
              >
                <div className="truncate font-medium">{c.title || 'Untitled'}</div>
                <div className="text-xs text-gray-400">
                  {new Date(c.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat column */}
        <div className="col-span-4 md:col-span-3 flex flex-col h-full min-h-0 border border-white/10 rounded-lg bg-black/20">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3 max-h-full">
            {chat.messages.map((m: ChatMessage) => (
              <div
                key={m.id}
                className={`p-3 rounded ${m.role === 'user' ? 'bg-white/5' : 'bg-emerald-500/10'} text-gray-200`}
              >
                <div className="text-[10px] tracking-wide uppercase text-gray-400 mb-1">
                  {m.role}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            ))}

            {approvals.length > 0 && (
              <div className="mt-2 border border-yellow-500/20 rounded p-3 bg-yellow-500/10 text-yellow-100">
                <div className="font-semibold mb-2">Tool approval required</div>
                <div className="space-y-2">
                  {approvals.map((a) => (
                    <div key={a.index} className="border border-white/10 rounded p-2 bg-black/20">
                      <div className="text-sm font-medium text-gray-100">{a.name}</div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                        {JSON.stringify(a.args, null, 2)}
                      </pre>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white"
                          onClick={() => onApprove(a.index)}
                        >
                          Approve
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                          onClick={() => onReject(a.index)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="flex-none border-t border-white/10 p-2 md:p-3 flex gap-2 bg-black/30">
            <input
              value={input}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-white/10 rounded px-3 py-2 bg-black/40 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
            />
            <button
              onClick={onSend}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              disabled={isPending || input.trim().length === 0}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
