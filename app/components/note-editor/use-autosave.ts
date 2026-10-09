'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer } from 'react';
import type { Note } from 'tt-services/src/client-index.ts';

import { updateNoteContent } from '@/(panel)/actions';

import { draftKey, NoteAutosave } from './autosave';

// Retain writers across rapid close/reopen so two requests for one note cannot race.
const sessions = new Map<string, NoteAutosave>();
const users = new Map<NoteAutosave, number>();
export function useNoteAutosave(noteId: string) {
  const queryClient = useQueryClient();
  const session = useMemo(() => {
    let existing = sessions.get(noteId);
    if (!existing) {
      existing = new NoteAutosave(
        async (content) => {
          await updateNoteContent(noteId, content);
          queryClient.setQueryData(
            ['note', noteId],
            (note: Note | undefined) => note && { ...note, content },
          );
        },
        (content) =>
          content === null
            ? localStorage.removeItem(draftKey(noteId))
            : localStorage.setItem(draftKey(noteId), content),
      );
      sessions.set(noteId, existing);
    }
    return existing;
  }, [noteId, queryClient]);
  const [, render] = useReducer((n) => n + 1, 0);
  useEffect(() => session.subscribe(render), [session]);
  useEffect(() => {
    users.set(session, (users.get(session) ?? 0) + 1);
    sessions.set(noteId, session);
    const flush = () => {
      void session.flush();
    };
    const hide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (session.status !== 'saved') {
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
      users.set(session, (users.get(session) ?? 1) - 1);
      // Keep failed/in-flight sessions until their draft is saved. Bounded by notes with unsaved edits.
      void session.flush().then((saved) => {
        if (
          saved &&
          !users.get(session) &&
          session.status === 'saved' &&
          sessions.get(noteId) === session
        ) {
          sessions.delete(noteId);
          users.delete(session);
        }
      });
    };
  }, [noteId, session]);
  return session;
}
