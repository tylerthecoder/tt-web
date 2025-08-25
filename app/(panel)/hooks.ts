'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getGoogleDriveFileById } from '@/google/docs/actions';
import type { GoogleDriveFile } from '@/types/google';

import {
  assignGoogleDocIdToNote,
  createList,
  getAllDailyNotesMetadata,
  getAllJots,
  getAllLists,
  getAllTags,
  getCurrentWeek,
  getListById,
  getNoteMetadataById,
  getNotesAndUntrackedGoogleDocs,
  getNotesMetadataByTag,
  getTodayDailyNote,
  pullContentFromGoogleDoc,
  updateNoteContent,
} from './actions';

export function useWeek() {
  return useQuery({
    queryKey: ['week'],
    queryFn: () => getCurrentWeek(),
    staleTime: 60_000,
  });
}

export function useJots() {
  return useQuery({
    queryKey: ['jots'],
    queryFn: () => getAllJots(),
    staleTime: 30_000,
  });
}

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: () => getAllLists(),
    staleTime: 30_000,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (name: string) => createList(name),
    onSuccess: (newList: any) => {
      queryClient.setQueryData<any[]>(['lists'], (existing) => {
        if (Array.isArray(existing)) {
          return [...existing, newList];
        }
        return [newList];
      });
    },
  });

  return {
    createList: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: (mutation.error as Error) || null,
  };
}

export function useGoogleDriveFileById(docId: string) {
  return useQuery<GoogleDriveFile | null>({
    queryKey: ['google-drive-file', docId],
    queryFn: async () => {
      const res = await getGoogleDriveFileById(docId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to load Google Doc');
      }
      return (res.file || null) as GoogleDriveFile | null;
    },
    enabled: !!docId,
    staleTime: 60_000,
  });
}

export function useDailyNote() {
  return useQuery({
    queryKey: ['daily-note'],
    queryFn: () => getTodayDailyNote(),
    staleTime: 15_000,
  });
}

export function useAllDailyNotesMetadata() {
  return useQuery({
    queryKey: ['daily-notes-metadata'],
    queryFn: () => getAllDailyNotesMetadata(),
    staleTime: 5 * 60_000,
  });
}

export function useNotesIndex() {
  return useQuery({
    queryKey: ['notes-index'],
    queryFn: () => getNotesAndUntrackedGoogleDocs(),
    staleTime: 60_000,
  });
}

export function useNotesByTag(tag: string) {
  return useQuery({
    queryKey: ['notes-by-tag', tag],
    queryFn: () => getNotesMetadataByTag(tag),
    enabled: !!tag,
    staleTime: 60_000,
  });
}

export function useList(listId: string) {
  return useQuery({
    queryKey: ['list', listId],
    queryFn: () => getListById(listId),
    enabled: !!listId,
    staleTime: 30_000,
  });
}

// Migrated note-related hooks

export const useNote = (noteId: string) => {
  const [note, setNote] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!noteId) return;
    // Reuse panel action getNote from actions via dynamic import
    (async () => {
      const { getNote } = await import('./actions');
      const n = await getNote(noteId);
      setNote(n);
      setLoading(false);
    })();
  }, [noteId]);

  return { note, loading };
};

export function useNoteMetadata(noteId: string) {
  return useQuery({
    queryKey: ['note-metadata', noteId],
    queryFn: () => getNoteMetadataById(noteId),
    enabled: !!noteId,
    staleTime: 60_000,
  });
}

export const useUpdateNoteContent = (noteId: string, debounceMs: number = 1000) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdate = useCallback(
    (content: string) => {
      setIsSyncing(true);
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(async () => {
        try {
          await updateNoteContent(noteId, content);
        } finally {
          setIsSyncing(false);
        }
      }, debounceMs);
    },
    [noteId, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, []);

  return { updateNote: debouncedUpdate, isSyncing };
};

export const useAssignGoogleDocIdToNote = (noteId: string) => {
  const [isAssigning, setIsAssigning] = useState(false);

  const assignGoogleDocId = useCallback(
    async (googleDocId: string) => {
      setIsAssigning(true);
      await assignGoogleDocIdToNote(noteId, googleDocId);
      setIsAssigning(false);
    },
    [noteId],
  );

  return { assignGoogleDocId, isAssigning };
};

export const useTags = () => {
  const query = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const result = await getAllTags();
      if (!(result as any).success)
        throw new Error((result as any).error || 'Failed to fetch tags');
      return (result as any).tags as string[];
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  return {
    tags: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
};

export const usePullFromGoogleDoc = (noteId: string) => {
  const [isPulling, setIsPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pullContent = useCallback(async () => {
    setIsPulling(true);
    setError(null);
    try {
      const updatedNote = await pullContentFromGoogleDoc(noteId);
      window.location.reload();
      return updatedNote;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to pull content from Google Doc';
      setError(errorMessage);
      throw err;
    } finally {
      setIsPulling(false);
    }
  }, [noteId]);

  return { pullContent, isPulling, error };
};
