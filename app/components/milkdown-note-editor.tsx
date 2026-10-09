'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Note } from 'tt-services/src/client-index.ts';

import { updateNoteMetadata } from '@/(panel)/actions';
import { useNote } from '@/(panel)/hooks';

import { GoogleSyncControls } from './google-sync-controls';
import { EditorSurface } from './note-editor/editor-surface';
import { discardDraft, readDrafts } from './note-editor/recovery';
import { useNoteAutosave } from './note-editor/use-autosave';
import NoteTagsModal from './note-tags-modal';
import { PublishControls } from './publish-controls';

const EMPTY_TAGS: string[] = [];

function LoadedEditor({
  note,
  hideTitle,
  showGoogleSync,
}: {
  note: Note;
  hideTitle: boolean;
  showGoogleSync: boolean;
}) {
  const queryClient = useQueryClient();
  const { autosave, restoreDraft } = useNoteAutosave(note.id);
  const [currentNote, setCurrentNote] = useState(note);
  const [initialContent, setInitialContent] = useState(autosave.content ?? note.content);
  const [generation, setGeneration] = useState(0);
  const [recoveries, setRecoveries] = useState(() =>
    autosave.content === undefined
      ? readDrafts(note.id).filter((draft) => draft.content !== note.content)
      : [],
  );
  const [recoveryIndex, setRecoveryIndex] = useState(0);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const recovery = recoveries[recoveryIndex] ?? null;
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [externalBusy, setExternalBusy] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const updateMetadata = async (updates: { title?: string; tags?: string[] }) => {
    await updateNoteMetadata(note.id, updates);
    setCurrentNote((previous) => ({ ...previous, ...updates }));
    queryClient.setQueryData(
      ['note', note.id],
      (previous: Note | undefined) => previous && { ...previous, ...updates },
    );
    for (const key of [
      'notes-index',
      'daily-notes-metadata',
      'notes-by-tag',
      'tags',
      'note-metadata',
    ]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
  const cancelTitle = () => {
    setTitleInput(currentNote.title);
    setEditingTitle(false);
    setMetadataError(null);
  };
  const saveTitle = async () => {
    if (savingMetadata || !titleInput.trim()) return;
    setSavingMetadata(true);
    setMetadataError(null);
    try {
      await updateMetadata({ title: titleInput.trim() });
      setEditingTitle(false);
    } catch {
      setMetadataError('Could not save the title. Please try again.');
    } finally {
      setSavingMetadata(false);
    }
  };
  const beforeExternalAction = async () => {
    if (recovery !== null) throw new Error('Resolve the recovered draft before continuing.');
    setExternalBusy(true);
    if (!(await autosave.flush())) {
      setExternalBusy(false);
      throw new Error('Save your note successfully before continuing.');
    }
  };

  const saveStatus = (
    <div className="flex h-6 w-28 shrink-0 items-center justify-end gap-2 whitespace-nowrap text-sm">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${
          autosave.status === 'saved'
            ? 'bg-green-400'
            : autosave.status === 'error'
              ? 'bg-red-400'
              : 'bg-yellow-400'
        }`}
      />
      <span
        role="status"
        aria-live="polite"
        className={
          autosave.status === 'saved'
            ? 'text-green-400'
            : autosave.status === 'error'
              ? 'text-red-300'
              : 'text-yellow-300'
        }
      >
        {autosave.status === 'error' ? (
          <button
            className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2"
            onClick={() => void autosave.flush()}
          >
            Retry save
          </button>
        ) : autosave.status === 'saved' ? (
          'Saved'
        ) : (
          'Saving…'
        )}
      </span>
    </div>
  );

  return (
    <div className="note-editor flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-900 text-gray-100">
      {(!hideTitle ||
        metadataError ||
        autosave.status === 'error' ||
        (!autosave.recoveryAvailable && autosave.status !== 'saved')) && (
        <div className="shrink-0 border-b border-gray-700 bg-gray-900 px-3 py-2 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!hideTitle && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {editingTitle ? (
                  <form
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveTitle();
                    }}
                  >
                    <input
                      autoFocus
                      aria-label="Note title"
                      value={titleInput}
                      disabled={savingMetadata}
                      onChange={(event) => setTitleInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape' && !savingMetadata) cancelTitle();
                      }}
                      className="min-h-11 min-w-0 flex-1 rounded border border-gray-600 bg-gray-800 px-2 text-base"
                    />
                    <button
                      className="editor-button"
                      disabled={savingMetadata || !titleInput.trim()}
                    >
                      {savingMetadata ? 'Saving…' : 'Save title'}
                    </button>
                    <button
                      type="button"
                      className="editor-button"
                      disabled={savingMetadata}
                      onClick={cancelTitle}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <h1 className="min-w-0 truncate text-lg font-medium" title={currentNote.title}>
                      {currentNote.title}
                    </h1>
                    <button
                      className="editor-button shrink-0"
                      onClick={() => setEditingTitle(true)}
                    >
                      Edit title
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {metadataError && (
            <p role="alert" className="py-2 text-sm text-red-300">
              {metadataError}
            </p>
          )}
          {!hideTitle && (
            <details className="mt-1 text-sm">
              <summary className="min-h-11 cursor-pointer py-3 text-gray-400">
                Tags & sharing {currentNote.tags?.length ? `(${currentNote.tags.length} tags)` : ''}
              </summary>
              <fieldset
                disabled={externalBusy || recovery !== null}
                className="flex flex-wrap items-center gap-3 pb-2"
              >
                {currentNote.tags?.map((tag) => (
                  <span key={tag} className="rounded-full bg-gray-700 px-2 py-1 text-xs">
                    {tag}
                  </span>
                ))}
                <button
                  className="editor-button"
                  onClick={(event) => {
                    event.currentTarget.focus();
                    setTagsOpen(true);
                  }}
                >
                  Edit tags
                </button>
                <PublishControls
                  note={currentNote}
                  beforeAction={beforeExternalAction}
                  afterAction={() => setExternalBusy(false)}
                  onPublishedChange={(published) =>
                    setCurrentNote((previous) => ({ ...previous, published }))
                  }
                />
                {showGoogleSync && (
                  <GoogleSyncControls
                    note={currentNote}
                    beforeAction={beforeExternalAction}
                    afterAction={() => setExternalBusy(false)}
                  />
                )}
              </fieldset>
            </details>
          )}
          {!autosave.recoveryAvailable && autosave.status !== 'saved' && (
            <p role="alert" className="py-2 text-sm text-amber-200">
              Local recovery is unavailable. Keep this page open until your note is saved.
            </p>
          )}
          {autosave.status === 'error' && (
            <p role="alert" className="py-2 text-sm text-red-300">
              Your changes have not reached the server.
              {autosave.recoveryAvailable ? ' A recovery copy is stored on this device.' : ''}
            </p>
          )}
        </div>
      )}
      {externalBusy && (
        <p role="status" className="px-4 py-2 text-sm text-gray-300">
          Finishing note action…
        </p>
      )}
      {recovery !== null ? (
        <div className="overflow-auto p-4">
          <p className="mb-3">
            This browser has{' '}
            {recoveries.length === 1 ? 'an unsaved draft' : `${recoveries.length} unsaved drafts`}.
            Review a draft before restoring it: restoring replaces the server note when saving
            succeeds. Other drafts stay on this device.
          </p>
          {recoveries.length > 1 && (
            <label className="mb-3 block">
              Recovery version
              <select
                className="ml-2 rounded bg-gray-800 p-2"
                value={recoveryIndex}
                onChange={(event) => setRecoveryIndex(Number(event.target.value))}
              >
                {recoveries.map((draft, index) => (
                  <option key={draft.key} value={index}>
                    Draft {index + 1} —{' '}
                    {draft.updatedAt === null
                      ? 'older format'
                      : new Date(draft.updatedAt).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
          )}
          {recoveryError && (
            <p role="alert" className="mb-3 text-red-300">
              {recoveryError}
            </p>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className="editor-button"
              onClick={() => {
                setInitialContent(recovery.content);
                setGeneration((n) => n + 1);
                restoreDraft(recovery);
                setRecoveries([]);
              }}
            >
              Restore draft
            </button>
            <button
              className="editor-button"
              onClick={() => {
                try {
                  if (!discardDraft(recovery)) {
                    setRecoveries(
                      readDrafts(note.id).filter((draft) => draft.content !== note.content),
                    );
                    setRecoveryIndex(0);
                    setRecoveryError(
                      'This draft changed in another tab. Review the updated version.',
                    );
                    return;
                  }
                  setRecoveries((drafts) => drafts.filter((draft) => draft.key !== recovery.key));
                  setRecoveryIndex(0);
                  setRecoveryError(null);
                } catch {
                  setRecoveryError(
                    'Could not remove the local draft. Browser storage may be unavailable.',
                  );
                }
              }}
            >
              {recoveries.length === 1 ? 'Keep server version' : 'Discard this draft'}
            </button>
          </div>
          <details>
            <summary className="cursor-pointer py-2">Review recovered Markdown</summary>
            <pre className="whitespace-pre-wrap break-words rounded bg-gray-800 p-3 text-sm">
              {recovery.content}
            </pre>
          </details>
        </div>
      ) : (
        <EditorSurface
          saveStatus={saveStatus}
          readOnly={externalBusy}
          key={generation}
          initialContent={initialContent}
          onChange={autosave.update}
          onSave={() => void autosave.flush()}
        />
      )}
      <NoteTagsModal
        open={tagsOpen}
        initialTags={currentNote.tags || EMPTY_TAGS}
        onClose={() => setTagsOpen(false)}
        onSave={(tags) => updateMetadata({ tags })}
      />
    </div>
  );
}

export function MilkdownEditor({
  noteId,
  hideTitle = false,
  showGoogleSync = true,
}: {
  noteId: string;
  hideTitle?: boolean;
  showGoogleSync?: boolean;
}) {
  const { note, loading, error, refetch } = useNote(noteId);
  if (loading)
    return (
      <div className="p-4" role="status">
        Loading note…
      </div>
    );
  if (error)
    return (
      <div className="p-4" role="alert">
        Could not load this note.{' '}
        <button className="editor-button" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  if (!note) return <div className="p-4">Note not found.</div>;
  return (
    <LoadedEditor key={noteId} note={note} hideTitle={hideTitle} showGoogleSync={showGoogleSync} />
  );
}
