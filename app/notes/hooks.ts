import { assignGoogleDocIdToNote, getNote, updateNoteContent, pullContentFromGoogleDoc } from '@/panel/actions';
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


export const useAssignGoogleDocIdToNote = (noteId: string) => {
    const [isAssigning, setIsAssigning] = useState(false);

    const assignGoogleDocId = useCallback(async (googleDocId: string) => {
        setIsAssigning(true);
        await assignGoogleDocIdToNote(noteId, googleDocId);
        setIsAssigning(false);
    }, [noteId]);

    return { assignGoogleDocId, isAssigning };
}

export const usePullFromGoogleDoc = (noteId: string) => {
    const [isPulling, setIsPulling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pullContent = useCallback(async () => {
        setIsPulling(true);
        setError(null);
        try {
            const updatedNote = await pullContentFromGoogleDoc(noteId);
            // Refresh the page to show the updated content
            window.location.reload();
            return updatedNote;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to pull content from Google Doc';
            setError(errorMessage);
            throw err;
        } finally {
            setIsPulling(false);
        }
    }, [noteId]);

    return { pullContent, isPulling, error };
}