"use client";

import { useState } from "react";
import { useAssignGoogleDocIdToNote } from '@/notes/hooks';

interface GoogleDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: string;
}

export function GoogleDocModal({ isOpen, onClose, noteId }: GoogleDocModalProps) {
    const [googleDocId, setGoogleDocId] = useState("");
    const { assignGoogleDocId, isAssigning } = useAssignGoogleDocIdToNote(noteId);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googleDocId.trim()) return;

        await assignGoogleDocId(googleDocId.trim());
        setGoogleDocId(""); // Clear the input
        onClose();
    };

    const handleClose = () => {
        setGoogleDocId(""); // Clear the input when closing
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Sync with Google Doc</h2>
                <p className="text-gray-300 mb-4 text-sm">
                    Enter the Google Doc ID to sync this note with a Google Document. You can find the ID in the Google Doc URL.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="googleDocId" className="block text-white text-sm font-bold mb-2">
                            Google Doc ID
                        </label>
                        <input
                            type="text"
                            id="googleDocId"
                            value={googleDocId}
                            onChange={(e) => setGoogleDocId(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            disabled={isAssigning}
                        />
                        <p className="text-gray-400 text-xs mt-1">
                            Example: docs.google.com/document/d/<strong>1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</strong>/edit
                        </p>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            disabled={isAssigning}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isAssigning || !googleDocId.trim()}
                        >
                            {isAssigning ? "Syncing..." : "Sync"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}