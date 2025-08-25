'use client';

import React, { useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export default function ChatMessageView({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const isTool = message.role === 'tool';
  return (
    <div
      className={`p-3 rounded ${message.role === 'user' ? 'bg-white/5' : 'bg-emerald-500/10'} text-gray-200`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[10px] tracking-wide uppercase text-gray-400">{message.role}</div>
        {isTool && (
          <button
            className="ml-auto text-xs text-gray-300 hover:text-gray-100 underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      {isTool ? (
        expanded ? (
          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
            {message.content}
          </pre>
        ) : (
          <></>
        )
      ) : (
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
      )}
    </div>
  );
}
