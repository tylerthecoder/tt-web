"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaSpinner } from 'react-icons/fa';

interface DeleteNoteButtonProps {
    noteId: string;
    title: string;
}

export function DeleteNoteButton({ noteId, title }: DeleteNoteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDeleteClick = () => {
        setShowConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowConfirm(false);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete note');
            }

            router.refresh();
            setShowConfirm(false);
        } catch (error) {
            console.error('Error deleting note:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={handleDeleteClick}
                className="py-1 px-3 border border-red-700 rounded text-sm text-red-400 hover:bg-red-900/30 transition-colors flex items-center"
                aria-label="Delete note"
            >
                <FaTrash className="mr-1" size={12} />
                Delete
            </button>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-red-400 mb-4">Delete Note</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-semibold">"{title}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="py-2 px-4 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="py-2 px-4 border border-red-700 bg-red-900/30 rounded text-red-300 hover:bg-red-900 transition-colors flex items-center"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <FaSpinner className="mr-2 animate-spin" size={14} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FaTrash className="mr-1" size={14} />
                                        Delete Note
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}