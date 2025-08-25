'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { useNoteMetadata } from '@/(panel)/hooks';

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
  const router = useRouter();
  const pathname = usePathname();
  const [chat, setChat] = useState<Chat>(initialChat);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [approvals, setApprovals] = useState<ApprovalPreview[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [toolExpanded, setToolExpanded] = useState<Record<string, boolean>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [rejectingIndex, setRejectingIndex] = useState<number | null>(null);

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
  }, [chat.messages.length]);

  const onSend = () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    setIsThinking(true);
    startTransition(async () => {
      try {
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
      } finally {
        setIsThinking(false);
      }
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
      router.push(`/ai/${(c as any).id}`);
    });
  };

  const onSelectChat = (id: string) => {
    startTransition(async () => {
      const c = await getChat(id);
      if (c) setChat(c as Chat);
      const res = await getPendingApprovals(id);
      setApprovals(res || []);
      scrollToBottom();
      if (!pathname?.endsWith(id)) router.push(`/ai/${id}`);
    });
  };

  const onApprove = (index: number) => {
    setApprovingIndex(index);
    startTransition(async () => {
      try {
        const res = await approveTool(chat.id, index);
        if (res.done && res.chat) {
          setChat(res.chat as Chat);
          setApprovals([]);
        } else {
          setApprovals(res.approvals || []);
        }
      } finally {
        setApprovingIndex(null);
      }
    });
  };

  const onReject = (index: number) => {
    setRejectingIndex(index);
    startTransition(async () => {
      try {
        const res = await rejectTool(chat.id, index);
        if (res.done && res.chat) {
          setChat(res.chat as Chat);
          setApprovals([]);
        } else {
          setApprovals(res.approvals || []);
        }
      } finally {
        setRejectingIndex(null);
      }
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
          <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3">
            {chat.messages.map((m: ChatMessage) => {
              const isTool = m.role === 'tool';
              const expanded = toolExpanded[m.id] ?? false;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded ${m.role === 'user' ? 'bg-white/5' : 'bg-emerald-500/10'} text-gray-200`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] tracking-wide uppercase text-gray-400">{m.role}</div>
                    {isTool && (
                      <button
                        className="ml-auto text-xs text-gray-300 hover:text-gray-100 underline"
                        onClick={() => setToolExpanded((s) => ({ ...s, [m.id]: !expanded }))}
                      >
                        {expanded ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                  </div>
                  {isTool ? (
                    expanded ? (
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{m.content}</pre>
                    ) : (
                      <div className="text-xs text-gray-400">Tool output hidden</div>
                    )
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  )}
                </div>
              );
            })}

            {isThinking && (
              <div className="p-3 rounded bg-emerald-500/5 text-gray-300">
                <div className="text-[10px] tracking-wide uppercase text-gray-500 mb-1">assistant</div>
                <div className="text-sm animate-pulse">Thinking…</div>
              </div>
            )}

            {approvals.length > 0 && (
              <div className="mt-2 border border-yellow-500/20 rounded p-3 bg-yellow-500/10 text-yellow-100">
                <div className="font-semibold mb-1">Tool approvals required ({approvals.length})</div>
                <div className="text-xs text-yellow-200/90 mb-2">
                  Read-only tools run automatically. Approve changes to continue.
                  The assistant may request more approvals after each approval.
                </div>
                <div className="space-y-2">
                  {approvals.map((a) => (
                    <ApprovalItem
                      key={a.index}
                      a={a}
                      onApprove={() => onApprove(a.index)}
                      onReject={() => onReject(a.index)}
                      isApproving={approvingIndex === a.index}
                      isRejecting={rejectingIndex === a.index}
                    />
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

function TagDiff({ current, proposed }: { current: string[]; proposed: string[] }) {
  const currentSet = new Set(current || []);
  const proposedSet = new Set(proposed || []);
  const toAdd = [...proposedSet].filter((t) => !currentSet.has(t));
  const toRemove = [...currentSet].filter((t) => !proposedSet.has(t));
  return (
    <div className="text-xs text-gray-300 space-y-1">
      <div>
        <span className="text-green-300">Add:</span> {toAdd.length ? toAdd.join(', ') : 'None'}
      </div>
      <div>
        <span className="text-red-300">Remove:</span> {toRemove.length ? toRemove.join(', ') : 'None'}
      </div>
    </div>
  );
}

function ApprovalItem({ a, onApprove, onReject, isApproving, isRejecting }: { a: ApprovalPreview; onApprove: () => void; onReject: () => void; isApproving?: boolean; isRejecting?: boolean }) {
  const { data: noteMeta, isLoading: loading } = useNoteMetadata(
    a.name === 'update_note_tags' && typeof a.args?.noteId === 'string' ? (a.args.noteId as string) : ''
  );
  const isUpdateTags = a.name === 'update_note_tags';
  const [viewJson, setViewJson] = useState(false);

  // Utilities for formatting
  const TagPill = ({ tag }: { tag: string }) => (
    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center mr-1 mb-1">
      <span className="mr-0">{tag}</span>
    </span>
  );

  const renderUpdateTags = () => {
    const current: string[] = (noteMeta?.tags as string[]) || [];
    const proposed: string[] = (a.args?.tags as string[]) || [];
    const currentSet = new Set(current);
    const proposedSet = new Set(proposed);
    const toAdd = [...proposedSet].filter((t) => !currentSet.has(t));
    const toRemove = [...currentSet].filter((t) => !proposedSet.has(t));

    if (viewJson) {
      return (
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">{JSON.stringify({ name: a.name, args: a.args }, null, 2)}</pre>
      );
    }

    const noteTitle = noteMeta?.title || 'note';
    const noteId = (a.args?.noteId as string) || '';
    const noteHref = `/note/${noteId}/view`;

    return (
      <div className="text-sm text-gray-100">
        <div>
          <span>Update </span>
          <Link href={noteHref} className="text-blue-300 hover:text-blue-200 underline">{noteTitle}</Link>
        </div>
        {toAdd.length > 0 && (
          <div className="mt-1 flex items-center flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Add:</span>
            <div className="flex flex-wrap">
              {toAdd.map((t) => (
                <TagPill key={`add-${t}`} tag={t} />
              ))}
            </div>
          </div>
        )}
        {toRemove.length > 0 && (
          <div className="mt-1 flex items-center flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Remove:</span>
            <div className="flex flex-wrap">
              {toRemove.map((t) => (
                <TagPill key={`remove-${t}`} tag={t} />
              ))}
            </div>
          </div>
        )}
        {toAdd.length === 0 && toRemove.length === 0 && (
          <div className="mt-1 text-xs text-gray-400">No tag changes</div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-white/10 rounded p-2 bg-black/20">
      <div className="flex items-center gap-2">
        {/* Header: hide tool name for update_note_tags */}
        {!isUpdateTags && (
          <div className="text-sm font-medium text-gray-100">{a.name}</div>
        )}
      </div>

      {isUpdateTags ? (
        <div className="mt-1">{renderUpdateTags()}</div>
      ) : (
        <pre className="mt-1 text-xs text-gray-300 whitespace-pre-wrap break-words">{JSON.stringify(a.args, null, 2)}</pre>
      )}

      <div className="mt-2 flex gap-2 items-center">
        <button
          className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
          onClick={onApprove}
          disabled={!!isApproving || !!isRejecting}
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </button>
        <button
          className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
          onClick={onReject}
          disabled={!!isApproving || !!isRejecting}
        >
          {isRejecting ? 'Rejecting…' : 'Reject'}
        </button>
        {isUpdateTags && (
          <button
            className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300 hover:bg-white/5"
            onClick={() => setViewJson((v) => !v)}
          >
            {viewJson ? 'View text' : 'View JSON'}
          </button>
        )}
      </div>
      {loading && <div className="text-xs text-gray-400 mt-1">Loading note…</div>}
    </div>
  );
}


