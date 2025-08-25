'use client';

import React from 'react';

type JsonModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  data: unknown;
};

export function JsonModal({ open, onClose, title = 'Metadata', data }: JsonModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 text-gray-300 hover:text-white">
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto">
          <pre className="text-xs text-gray-200 whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
