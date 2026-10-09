import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryProvider } from '../../app/components/query-provider';
import { MilkdownEditor } from '../../app/components/milkdown-note-editor';

function Fixture() {
  const [noteId, setNoteId] = useState('one');
  const [open, setOpen] = useState(true);
  return (
    <QueryProvider>
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        <div className="flex shrink-0 gap-2">
          <button
            className="editor-button"
            onClick={() => setNoteId((id) => (id === 'one' ? 'two' : 'one'))}
          >
            Switch note
          </button>
          <button className="editor-button" onClick={() => setOpen((value) => !value)}>
            {open ? 'Close editor' : 'Open editor'}
          </button>
        </div>
        {open && (
          <MilkdownEditor
            noteId={noteId}
            showGoogleSync={new URLSearchParams(location.search).has('google')}
          />
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
