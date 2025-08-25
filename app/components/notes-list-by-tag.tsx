'use client';

import { useState } from 'react';

import { useNotesByTag } from '@/(panel)/hooks';

import { NoteModal } from './note-modal';

interface NotesListByTagProps {
  tag: string;
  title?: string;
}

export default function NotesListByTag({ tag, title }: NotesListByTagProps) {
  const { data: notes, isLoading } = useNotesByTag(tag);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  return (
    <div className="w-full">
      {title && <h2 className="text-xl font-semibold text-white mb-3 text-center">{title}</h2>}
      {isLoading ? (
        <div className="text-gray-300">Loading…</div>
      ) : !notes || notes.length === 0 ? (
        <div className="text-gray-400 text-sm">No notes with tag "{tag}".</div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note: any) => (
            <li key={note.id}>
              <button
                className="w-full text-left px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors text-white"
                onClick={() => setActiveNoteId(note.id)}
              >
                {note.title}
              </button>
            </li>
          ))}
        </ul>
      )}

      <NoteModal
        noteId={activeNoteId}
        onClose={() => setActiveNoteId(null)}
        hideTitle
        title="Note"
      />
    </div>
  );
}
