import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MilkdownEditor } from '../../app/components/milkdown-note-editor';
import { NoteModal } from '../../app/components/note-modal';
import { QueryProvider } from '../../app/components/query-provider';

function Fixture() {
  const modal = new URLSearchParams(location.search).has('modal');
  const [noteId, setNoteId] = useState('one');
  const [open, setOpen] = useState(!modal);
  return (
    <QueryProvider>
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="editor-button"
            onClick={() => setNoteId((id) => (id === 'one' ? 'two' : 'one'))}
          >
            Switch note
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close editor' : 'Open editor'}
          </button>
        </div>
        {open && modal ? (
          <NoteModal
            noteId={noteId}
            onClose={() => setOpen(false)}
            hideTitle={new URLSearchParams(location.search).has('daily')}
            title="Note editor"
          />
        ) : (
          open && (
            <MilkdownEditor
              noteId={noteId}
              hideTitle={new URLSearchParams(location.search).has('daily')}
              showGoogleSync={new URLSearchParams(location.search).has('google')}
            />
          )
        )}
      </div>
    </QueryProvider>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
