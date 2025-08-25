'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

import { useNoteMetadata } from '@/(panel)/hooks';

import {
  approveTool,
  continueAfterApprovals,
  getPendingApprovals,
  rejectTool,
  sendUserMessage,
} from './actions';
import ChatMessageView from './ChatMessage';

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

export default function ChatColumn({ chat }: { chat: Chat }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Per-message expand state is managed inside ChatMessageView
  const [chatLocal, setChatLocal] = useState<Chat>(chat);
  const [approvals, setApprovals] = useState<ApprovalPreview[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const [rejectingIndex, setRejectingIndex] = useState<number | null>(null);
  const [input, setInput] = useState('');

  // Sync incoming chat prop to local and fetch approvals
  useEffect(() => {
    let active = true;
    setChatLocal(chat);
    setApprovals([]);
    setApprovalsLoading(true);
    // reset handled in message components
    (async () => {
      try {
        const res = await getPendingApprovals(chat.id);
        if (!active) return;
        setApprovals(res || []);
      } finally {
        if (active) setApprovalsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLocal.messages.length]);

  const onSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    setIsThinking(true);
    try {
      const result = await sendUserMessage(chatLocal.id, content);
      if (result.done) {
        setChatLocal(result.chat as Chat);
        setApprovals([]);
      } else {
        setApprovals(result.approvals || []);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const onApprove = async (index: number) => {
    setApprovingIndex(index);
    try {
      const res = await approveTool(chatLocal.id, index);
      const remaining = res.approvals || [];
      setApprovals(remaining);
      if (remaining.length === 0) {
        setIsThinking(true);
        try {
          const cont = await continueAfterApprovals(chatLocal.id);
          if (cont.done && cont.chat) {
            setChatLocal(cont.chat as Chat);
            setApprovals([]);
          } else {
            setApprovals(cont.approvals || []);
          }
        } finally {
          setIsThinking(false);
        }
      }
    } finally {
      setApprovingIndex(null);
    }
  };

  const onReject = async (index: number) => {
    setRejectingIndex(index);
    try {
      const res = await rejectTool(chatLocal.id, index);
      setApprovals(res.approvals || []);
    } finally {
      setRejectingIndex(null);
    }
  };

  return (
    <div className="col-span-4 md:col-span-3 flex flex-col h-full min-h-0 border border-white/10 rounded-lg bg-black/20">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3">
        {chatLocal.messages.map((m: any) => (
          <ChatMessageView key={m.id} message={m} />
        ))}

        {isThinking && (
          <div className="p-3 rounded bg-emerald-500/5 text-gray-300">
            <div className="text-[10px] tracking-wide uppercase text-gray-500 mb-1">assistant</div>
            <div className="text-sm animate-pulse">Thinking…</div>
          </div>
        )}

        {(approvalsLoading || approvals.length > 0) && (
          <div className="mt-2 border border-yellow-500/20 rounded p-3 bg-yellow-500/10 text-yellow-100">
            <div className="font-semibold mb-1">Tool approvals</div>
            <div className="text-xs text-yellow-200/90 mb-2">
              Read-only tools run automatically. Approve changes to continue.
            </div>
            {approvalsLoading ? (
              <div className="text-sm text-yellow-200 flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-yellow-300 border-t-transparent animate-spin" />
                Loading approvals…
              </div>
            ) : (
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
            )}
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
          disabled={input.trim().length === 0}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ApprovalItem({
  a,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  a: ApprovalPreview;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const isUpdateNote = a.name === 'update_note';
  const noteIdParam =
    isUpdateNote && typeof a.args?.noteId === 'string' ? (a.args.noteId as string) : '';
  const { data: noteMeta, isLoading: loading } = useNoteMetadata(noteIdParam);
  const [viewJson, setViewJson] = useState(false);

  const TagPill = ({ tag }: { tag: string }) => (
    <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center mr-1 mb-1">
      <span className="mr-0">{tag}</span>
    </span>
  );

  const renderUpdateNote = () => {
    const currentTags: string[] = (noteMeta?.tags as string[]) || [];
    const proposedTags: string[] | null = Array.isArray(a.args?.tags)
      ? (a.args.tags as string[])
      : null;
    const currentSet = new Set(currentTags);
    let toAdd: string[] = [];
    let toRemove: string[] = [];
    if (proposedTags !== null) {
      const proposedSet = new Set(proposedTags);
      toAdd = [...proposedSet].filter((t) => !currentSet.has(t));
      toRemove = [...currentTags].filter((t) => !proposedSet.has(t));
    }
    const currentTitle = noteMeta?.title || '';
    const nextTitle = typeof a.args?.title === 'string' ? (a.args.title as string) : undefined;
    const currentDate = noteMeta?.date || '';
    const nextDate = typeof a.args?.date === 'string' ? (a.args.date as string) : undefined;

    if (viewJson) {
      return (
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
          {JSON.stringify({ name: a.name, args: a.args }, null, 2)}
        </pre>
      );
    }

    const noteTitle = noteMeta?.title || 'note';
    const noteId = (a.args?.noteId as string) || '';
    const noteHref = `/note/${noteId}/view`;

    return (
      <div className="text-sm text-gray-100">
        <div>
          <span>Update </span>
          <Link href={noteHref} className="text-blue-300 hover:text-blue-200 underline">
            {noteTitle}
          </Link>
        </div>
        {typeof nextTitle === 'string' && nextTitle !== currentTitle && (
          <div className="mt-1 text-xs text-gray-300">
            <span className="text-gray-400 mr-2">Title:</span>
            <span className="line-through text-gray-500 mr-2">{currentTitle || '—'}</span>
            <span className="text-gray-100">{nextTitle || '—'}</span>
          </div>
        )}
        {typeof nextDate === 'string' && nextDate !== currentDate && (
          <div className="mt-1 text-xs text-gray-300">
            <span className="text-gray-400 mr-2">Date:</span>
            <span className="line-through text-gray-500 mr-2">{currentDate || '—'}</span>
            <span className="text-gray-100">{nextDate || '—'}</span>
          </div>
        )}
        {proposedTags !== null && toAdd.length > 0 && (
          <div className="mt-1 flex items-center flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Add:</span>
            <div className="flex flex-wrap">
              {toAdd.map((t) => (
                <TagPill key={`add-${t}`} tag={t} />
              ))}
            </div>
          </div>
        )}
        {proposedTags !== null && toRemove.length > 0 && (
          <div className="mt-1 flex items-center flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Remove:</span>
            <div className="flex flex-wrap">
              {toRemove.map((t) => (
                <TagPill key={`remove-${t}`} tag={t} />
              ))}
            </div>
          </div>
        )}
        {(() => {
          const titleChanged = typeof nextTitle === 'string' && nextTitle !== currentTitle;
          const dateChanged = typeof nextDate === 'string' && nextDate !== currentDate;
          const tagsChanged = proposedTags !== null && (toAdd.length > 0 || toRemove.length > 0);
          return !titleChanged && !dateChanged && !tagsChanged;
        })() && <div className="mt-1 text-xs text-gray-400">No changes</div>}
      </div>
    );
  };

  return (
    <div className="border border-white/10 rounded p-2 bg-black/20">
      <div className="flex items-center gap-2">
        {!isUpdateNote && <div className="text-sm font-medium text-gray-100">{a.name}</div>}
      </div>

      {isUpdateNote ? (
        <div className="mt-1">{renderUpdateNote()}</div>
      ) : (
        <pre className="mt-1 text-xs text-gray-300 whitespace-pre-wrap break-words">
          {JSON.stringify(a.args, null, 2)}
        </pre>
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
        {isUpdateNote && (
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
