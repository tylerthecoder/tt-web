"use client";

import { useState } from "react";
import { DeleteModal } from "../components/delete-modal";
import { deleteNote } from "./actions";

interface DeleteNoteButtonProps {
    noteId: string;
    title: string;
}

export function DeleteNoteButton({ noteId, title }: DeleteNoteButtonProps) {
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async () => {
        await deleteNote(noteId);
        setShowModal(false);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
                Delete
            </button>

            <DeleteModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDelete}
                title={title}
            />
        </>
    );
}