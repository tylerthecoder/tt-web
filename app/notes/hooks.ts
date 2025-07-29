import { getNote, updateNoteContent } from '@/panel/actions';
import { Note } from 'tt-services';
import { useEffect, useState, useRef, useCallback } from 'react';


export const useNote = (noteId: string) => {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getNote(noteId).then((note) => {
            setNote(note);
            setLoading(false);
        });
    }, [noteId]);

    console.log("note", note, noteId, loading);

    return { note, loading };
}


export const useUpdateNoteContent = (noteId: string, debounceMs: number = 1000) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedUpdate = useCallback((content: string) => {
        setIsSyncing(true);

        // Clear any existing timeout
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Schedule new update
        updateTimeoutRef.current = setTimeout(async () => {
            try {
                await updateNoteContent(noteId, content);
            } finally {
                setIsSyncing(false);
            }
        }, debounceMs);
    }, [noteId, debounceMs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    return { updateNote: debouncedUpdate, isSyncing };
};