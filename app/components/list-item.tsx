"use client";

import { useState } from "react";
import { toggleItemCheck, addNoteToItem, deleteListItem } from "@/(panel)/panel/actions";
import { createNote } from "@/(panel)/panel/actions";
import { MilkdownEditor } from '@/components/milkdown-note-editor';
import type { ListItem as ListItemType } from "tt-services";
import { formatDistanceToNow } from "date-fns";

interface ListItemProps {
    item: ListItemType;
    listId: string;
}

export function ListItem({ item, listId }: ListItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateNote = async () => {
        try {
            setIsCreatingNote(true);
            const note = await createNote(item.content);
            await addNoteToItem(listId, item.id, note.id);
        } catch (error) {
            console.error("Failed to create note:", error);
        } finally {
            setIsCreatingNote(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteListItem(listId, item.id);
        } catch (error) {
            console.error("Failed to delete item:", error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItemCheck(listId, item.id)}
                    className="w-5 h-5 rounded"
                />
                <span className={item.checked ? "line-through text-gray-500" : "text-white"}>
                    {item.content}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-400" title={item.updatedAt}>
                        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                    </span>
                    {!item.noteId && (
                        <button
                            onClick={handleCreateNote}
                            disabled={isCreatingNote}
                            className="text-blue-500 hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            {isCreatingNote ? "Creating..." : "Add Note"}
                        </button>
                    )}
                    {item.noteId && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-500 hover:text-blue-400"
                        >
                            {isExpanded ? "Hide Note" : "Show Note"}
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
            {isExpanded && item.noteId && (
                <div className="mt-4 h-[300px]">
                    <MilkdownEditor noteId={item.noteId} />
                </div>
            )}
        </div>
    );
}


