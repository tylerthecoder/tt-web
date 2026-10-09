'use client';

import { MilkdownEditor } from './milkdown-note-editor';
import { EditorDialog } from './note-editor/dialog';

type NoteModalProps = {
  noteId: string | null;
  onClose: () => void;
  hideTitle?: boolean;
  title?: string;
};

export function NoteModal({
  noteId,
  onClose,
  hideTitle = true,
  title = 'Note',
}: NoteModalProps) {
  if (!noteId) return null;

  return (
    <EditorDialog
      open={!!noteId}
      onClose={onClose}
      label={title}
      className="w-full max-w-5xl max-h-none"
    >
      <div className="bg-gray-900 sm:rounded-lg shadow-xl w-full max-w-5xl h-[100dvh] sm:h-[85dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="editor-button">
            Close
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <MilkdownEditor noteId={noteId} hideTitle={hideTitle} />
        </div>
      </div>
    </EditorDialog>
  );
}
