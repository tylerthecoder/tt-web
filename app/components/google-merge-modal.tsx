"use client";

import { useEffect, useMemo, useState } from "react";
import { isGoogleNote, Note } from "tt-services/src/client-index.ts";
import { stageGoogleDocContentForMerge, updateNoteContent } from "@/panel/actions";

interface GoogleMergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note;
}

function basicTwoWayMerge(current: string, incoming: string): string {
    if (current === incoming) return current;
    return [
        "<<<<<<< Current",
        current,
        "=======",
        incoming,
        ">>>>>>> GoogleDoc",
    ].join("\n");
}

export function GoogleMergeModal({ isOpen, onClose, note }: GoogleMergeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [googleDocContent, setGoogleDocContent] = useState<string>("");
    const [mergedContent, setMergedContent] = useState<string>("");

    const isGNote = isGoogleNote(note);

    useEffect(() => {
        if (!isOpen || !isGNote) return;

        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const updated = await stageGoogleDocContentForMerge(note.id);
                const gContent = updated.googleDocContent || "";
                const mergedContent = basicTwoWayMerge(note.content, gContent);
                console.log("Google Doc Content", gContent);
                console.log("Merged Content", mergedContent);
                setGoogleDocContent(gContent);
                setMergedContent(mergedContent);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load Google Doc content");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [isOpen, isGNote, note]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-4 md:p-6 rounded-lg w-full max-w-5xl mx-3">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Merge from Google Doc</h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
                </div>

                {error && <div className="text-sm text-red-400 mb-2">{error}</div>}
                {loading ? (
                    <div className="text-gray-300">Loading latest Google Doc content…</div>
                ) : !isGNote ? (
                    <div className="text-gray-300">This is not a Google note.</div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-400 mb-1">Current note content</label>
                                <textarea
                                    className="w-full h-40 md:h-64 bg-gray-900 text-gray-100 p-2 rounded border border-gray-700"
                                    value={note.content}
                                    readOnly
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-400 mb-1">Latest Google Doc content</label>
                                <textarea
                                    className="w-full h-40 md:h-64 bg-gray-900 text-gray-100 p-2 rounded border border-gray-700"
                                    value={googleDocContent}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-gray-400 mb-1">Merged content (editable)</label>
                            <textarea
                                className="w-full h-48 md:h-60 bg-gray-900 text-gray-100 p-2 rounded border border-gray-700"
                                value={mergedContent}
                                onChange={(e) => setMergedContent(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await updateNoteContent(note.id, mergedContent);
                                        onClose();
                                        // Optionally, refresh page to reflect changes in editor
                                        window.location.reload();
                                    } catch (e) {
                                        setError(e instanceof Error ? e.message : "Failed to update note content");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Updating…" : "Update"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}