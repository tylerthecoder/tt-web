"use client";

import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Crepe } from '@milkdown/crepe';
import { listenerCtx } from '@milkdown/plugin-listener';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { useEffect, useState, useRef } from 'react';
import { getNote, updateNoteContent } from './actions';
import { Note } from 'tt-services/src/services/NotesService';

interface EditorProps {
    noteId: string;
    initialContent: string;
    onSyncChange: (isSyncing: boolean) => void;
}

const CrepeEditor: React.FC<EditorProps> = ({ noteId, initialContent, onSyncChange }) => {
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingContentRef = useRef<string | null>(null);
    const isUpdatingRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const updateContent = async (content: string) => {
        if (isUpdatingRef.current) {
            // If currently updating, store the latest content
            pendingContentRef.current = content;
            console.log("Adding pending content");
            return;
        }

        try {
            isUpdatingRef.current = true;
            onSyncChange(true);
            console.log("Saving note content");
            await updateNoteContent(noteId, content);
        } finally {
            isUpdatingRef.current = false;
            onSyncChange(false);
            console.log("Done saving note content");
            // Check if there's pending content to update
            if (pendingContentRef.current !== null) {
                const pendingContent = pendingContentRef.current;
                pendingContentRef.current = null;
                updateContent(pendingContent);
            }
        }
    };

    const { get } = useEditor((root) => {
        return new Crepe({
            root: rootRef.current,
            defaultValue: initialContent,
        });
    });

    useEffect(() => {
        const editor = get();
        if (!editor) return;

        editor.action((ctx) => {
            ctx.get(listenerCtx)
                .markdownUpdated((ctx, markdown, prevMarkdown) => {
                    if (markdown !== prevMarkdown) {
                        onSyncChange(true);

                        // Clear any existing timeout
                        if (updateTimeoutRef.current) {
                            clearTimeout(updateTimeoutRef.current);
                        }

                        // Schedule new update
                        updateTimeoutRef.current = setTimeout(() => {
                            updateContent(markdown);
                        }, 1000);
                    }
                });
        });

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [get, noteId]);

    return (
        <div ref={rootRef} className="flex flex-col h-full">
            <Milkdown />
        </div>
    );
};

export const MilkdownEditorWrapper: React.FC<{ noteId: string, hideTitle?: boolean }> = ({ noteId, hideTitle = false }) => {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        getNote(noteId).then((note) => {
            console.log("Setting content", note);
            setNote(note);
            setLoading(false);
        });
    }, [noteId]);

    if (loading) {
        return <div className="h-full flex items-center justify-center">Loading editor...</div>;
    }

    if (!note) {
        return <div className="h-full flex items-center justify-center">Note not found</div>;
    }

    return (
        <div className="h-full overflow-hidden">
            <div className="flex items-start justify-between px-3 md:px-4 py-2 bg-gray-700">
                {!hideTitle && (
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <h1 className="text-xl md:text-3xl text-gray-300 font-medium truncate">
                            {note.title}
                        </h1>
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {note.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="bg-blue-600 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
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
                <MilkdownProvider>
                    <CrepeEditor
                        noteId={noteId}
                        initialContent={note.content}
                        onSyncChange={setIsSyncing}
                    />
                </MilkdownProvider>
            </div>
        </div>
    );
};