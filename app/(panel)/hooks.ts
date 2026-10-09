'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { flushNoteBeforeRead } from '@/components/note-editor/use-autosave';
import { getGoogleDriveFileById } from '@/google/docs/actions';
import type { GoogleDriveFile } from '@/types/google';

import {
  createList,
  getAllDailyNotesMetadata,
  getAllJots,
  getAllLists,
  getAllTags,
  getCurrentWeek,
  getNoteMetadataById,
  getNotesAndUntrackedGoogleDocs,
  getNotesMetadataByTag,
  getTodayDailyNote,
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

// Migrated note-related hooks

export const useNote = (noteId: string) => {
  const query = useQuery({
    queryKey: ['note', noteId],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { getNote } = await import('./actions');
      await flushNoteBeforeRead(noteId);
      return getNote(noteId);
    },
    enabled: !!noteId,
    // Never replace the document under an active cursor on window focus.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return {
    note: query.data,
    loading: query.isPending || query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

export function useNoteMetadata(noteId: string) {
  return useQuery({
    queryKey: ['note-metadata', noteId],
    queryFn: () => getNoteMetadataById(noteId),
    enabled: !!noteId,
    staleTime: 60_000,
  });
}

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
