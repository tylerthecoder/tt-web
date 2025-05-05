"use client";

import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Crepe } from '@milkdown/crepe';
import { listenerCtx } from '@milkdown/plugin-listener';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { useEffect, useState, useRef } from 'react';
import { getNote, updateNoteContent } from './actions';

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
    const [content, setContent] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        getNote(noteId).then((note) => {
            console.log("Setting content", note);
            setContent(note?.content || '');
            setTitle(note?.title || '');
            setLoading(false);
        });
    }, [noteId]);

    if (loading) {
        return <div className="h-full flex items-center justify-center">Loading editor...</div>;
    }

    return (
        <div className="h-full">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
                {!hideTitle && (
                    <h1 className="text-3xl text-gray-300 font-medium truncate">
                        {title}
                    </h1>
                )}
                <div className="flex items-center space-x-2">
                    {isSyncing ? (
                        <>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-300">Syncing...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">Saved</span>
                        </>
                    )}
                </div>
            </div>
            <div className="h-[calc(100%-1.5rem)] bg-gray-800 overflow-hidden">
                <MilkdownProvider>
                    <CrepeEditor
                        noteId={noteId}
                        initialContent={content}
                        onSyncChange={setIsSyncing}
                    />
                </MilkdownProvider>
            </div>
        </div>
    );
};