"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "./actions";

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateNoteModal({ isOpen, onClose }: CreateNoteModalProps) {
    const [title, setTitle] = useState("");
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const note = await createNote(title);
        onClose();
        router.push(`/notes/${note.id}/edit`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Create New Note</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-white text-sm font-bold mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="Enter note title"
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}