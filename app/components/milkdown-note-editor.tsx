'use client';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

import { Crepe } from '@milkdown/crepe';
import { listenerCtx } from '@milkdown/plugin-listener';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { useEffect, useState } from 'react';
import { Note } from 'tt-services/src/client-index.ts';

import { updateNoteMetadata } from '@/(panel)/actions';

import { useNote, useUpdateNoteContent } from '../(panel)/hooks';
import { GoogleSyncControls } from './google-sync-controls';
import NoteTagsModal from './note-tags-modal';
import { PublishControls } from './publish-controls';

interface MilkdownEditorWithNoteProps {
  note: Note;
  hideTitle?: boolean;
  showGoogleSync?: boolean;
}

const MilkdownEditorWithNote: React.FC<MilkdownEditorWithNoteProps> = ({
  note,
  hideTitle = false,
  showGoogleSync = true,
}) => {
  const { updateNote, isSyncing } = useUpdateNoteContent(note.id);

  const { get } = useEditor((root) => {
    return new Crepe({
      root,
      defaultValue: note.content,
    });
  });

  useEffect(() => {
    const editor = get();
    if (!editor) return;

    editor.action((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          updateNote(markdown);
        }
      });
    });
  }, [get, updateNote]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    setTitleInput(note.title);
  }, [note.title]);

  const saveTitle = async () => {
    const newTitle = titleInput.trim();
    if (!newTitle || newTitle === note.title) {
      setEditingTitle(false);
      return;
    }
    await updateNoteMetadata(note.id, { title: newTitle });
    window.location.reload();
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex items-start justify-between px-3 md:px-4 py-2 bg-gray-700">
        {!hideTitle && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {editingTitle ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="px-2 py-1 rounded bg-black/40 border border-white/10 text-gray-100 text-xl md:text-3xl font-medium min-w-0 flex-1"
                />
              ) : (
                <h1
                  className="text-xl md:text-3xl text-gray-300 font-medium truncate"
                  onDoubleClick={() => setEditingTitle(true)}
                >
                  {note.title}
                </h1>
              )}
              {editingTitle ? (
                <>
                  <button
                    onClick={saveTitle}
                    className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitle(false);
                      setTitleInput(note.title);
                    }}
                    className="px-2 py-1 rounded border border-white/10 text-gray-300 hover:bg-white/5 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="px-2 py-1 rounded border border-white/10 text-gray-300 hover:bg-white/5 text-sm"
                >
                  Edit title
                </button>
              )}
            </div>

            {/* Publish Controls + Google Sync Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <PublishControls note={note} className="text-xs md:text-sm" />
              {showGoogleSync && <GoogleSyncControls note={note} className="text-xs md:text-sm" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {note.tags && note.tags.length > 0 ? (
                note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-600 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No tags</span>
              )}
              <button
                onClick={() => setTagsOpen(true)}
                className="px-2 py-0.5 rounded border border-white/10 text-gray-300 hover:bg-white/5 text-xs"
              >
                Edit tags
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {isSyncing ? (
            <>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm text-gray-300">Syncing...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs md:text-sm text-gray-300">Saved</span>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-800 overflow-hidden h-full">
        <div className="flex flex-col h-full [&>*]:h-full">
          <Milkdown />
        </div>
      </div>
      <NoteTagsModal
        open={tagsOpen}
        initialTags={note.tags || []}
        onClose={() => setTagsOpen(false)}
        onSave={async (tags) => {
          await updateNoteMetadata(note.id, { tags });
          window.location.reload();
        }}
      />
    </div>
  );
};

interface MilkdownEditorProps {
  noteId: string;
  hideTitle?: boolean;
  showGoogleSync?: boolean;
}

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  noteId,
  hideTitle = false,
  showGoogleSync = true,
}) => {
  const { note, loading } = useNote(noteId);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading note...</div>;
  }

  if (!note) {
    return <div className="h-full flex items-center justify-center">Note not found</div>;
  }

  return (
    <MilkdownProvider>
      <MilkdownEditorWithNote note={note} hideTitle={hideTitle} showGoogleSync={showGoogleSync} />
    </MilkdownProvider>
  );
};
