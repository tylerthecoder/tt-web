'use client';

import React from 'react';

import { MilkdownEditor } from './milkdown-note-editor';

type NoteModalProps = {
  noteId: string | null;
  onClose: () => void;
  hideTitle?: boolean;
  title?: string;
};

export function NoteModal({ noteId, onClose, hideTitle = true, title = 'Note' }: NoteModalProps) {
  if (!noteId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 text-gray-300 hover:text-white">
            Close
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <MilkdownEditor noteId={noteId} hideTitle={hideTitle} />
        </div>
      </div>
    </div>
  );
}
