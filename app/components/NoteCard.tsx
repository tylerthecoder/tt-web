'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { Note } from 'tt-services/src/services/NotesService';
import { DeleteNoteButton } from '../notes/delete-note-button';
import { FaFileAlt, FaEye, FaEdit } from 'react-icons/fa';
import { TagManager } from './TagManager';

interface NoteCardProps {
    note: Note;
    availableTags: string[];
}

export function NoteCard({ note, availableTags }: NoteCardProps) {
    const lastModified = note.updatedAt || note.createdAt || new Date().toISOString();

    return (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center">
                    <FaFileAlt className="text-red-400 mr-2" size={18} />
                    <h3 className="text-xl font-semibold text-red-400 line-clamp-2">{note.title}</h3>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    Last modified {formatDistance(new Date(lastModified), new Date(), { addSuffix: true })}
                </p>
            </div>
            <div className="p-4 flex-grow">
                {note.content && (
                    <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                        {note.content.substring(0, 150)}
                        {note.content.length > 150 ? '...' : ''}
                    </p>
                )}

                <TagManager
                    itemId={note.id}
                    tags={note.tags}
                    availableTags={availableTags}
                    className="mt-3"
                />
            </div>
            <div className="p-4 bg-gray-950 flex justify-end gap-2">
                <Link
                    href={`/notes/${note.id}`}
                    className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
                >
                    <FaEye className="mr-1" size={12} />
                    View
                </Link>
                <Link
                    href={`/notes/${note.id}/edit`}
                    className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
                >
                    <FaEdit className="mr-1" size={12} />
                    Edit
                </Link>
                <DeleteNoteButton noteId={note.id} title={note.title} />
            </div>
        </div>
    );
}