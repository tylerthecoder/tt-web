'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer } from 'react';
import type { Note } from 'tt-services/src/client-index.ts';

import { updateNoteContent } from '@/(panel)/actions';

import { NoteAutosave } from './autosave';
import { NoteDraftStore, type RecoveryDraft } from './recovery';

// Retain writers across rapid close/reopen so two requests for one note cannot race.
interface NoteSession {
  autosave: NoteAutosave;
  restoreDraft: (draft: RecoveryDraft) => void;
}
const sessions = new Map<string, NoteSession>();
const users = new Map<NoteAutosave, number>();
export function useNoteAutosave(noteId: string) {
  const queryClient = useQueryClient();
  const session = useMemo(() => {
    let existing = sessions.get(noteId);
    if (!existing) {
      const drafts = new NoteDraftStore(noteId);
      const autosave = new NoteAutosave(async (content) => {
        await updateNoteContent(noteId, content);
        queryClient.setQueryData(
          ['note', noteId],
          (note: Note | undefined) => note && { ...note, content },
        );
      }, drafts.persist);
      existing = {
        autosave,
        restoreDraft: (draft) => {
          drafts.adopt(draft);
          autosave.update(draft.content);
        },
      };
      sessions.set(noteId, existing);
    }
    return existing;
  }, [noteId, queryClient]);
  const autosave = session.autosave;
  const [, render] = useReducer((n) => n + 1, 0);
  useEffect(() => autosave.subscribe(render), [autosave]);
  useEffect(() => {
    users.set(autosave, (users.get(autosave) ?? 0) + 1);
    sessions.set(noteId, session);
    const flush = () => {
      void autosave.flush();
    };
    const hide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (autosave.status !== 'saved') {
        flush();
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('online', flush);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('online', flush);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('visibilitychange', hide);
      users.set(autosave, (users.get(autosave) ?? 1) - 1);
      // Keep failed/in-flight sessions until their draft is saved. Bounded by notes with unsaved edits.
      void autosave.flush().then((saved) => {
        if (
          saved &&
          !users.get(autosave) &&
          autosave.status === 'saved' &&
          sessions.get(noteId) === session
        ) {
          sessions.delete(noteId);
          users.delete(autosave);
        }
      });
    };
  }, [noteId, session, autosave]);
  return session;
}
