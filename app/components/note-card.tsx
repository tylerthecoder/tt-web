'use client';

import React from 'react';
import Link from 'next/link';
import { FaFileAlt, FaEye, FaEdit, FaExternalLinkAlt, FaGoogle } from 'react-icons/fa';
import { isGoogleNoteMetadata, NoteMetadata } from 'tt-services/src/client-index';
import { LayoutMode } from '../notes/NotesPageClient';
import { BaseCard } from './base-card';
import { DeleteNoteButton } from '../notes/delete-note-button';
import { NoteTagManager } from './note-tag-manager';

interface NoteCardProps {
    note: NoteMetadata;
    layout?: LayoutMode;
}

export function NoteCard({ note, layout = 'grid' }: NoteCardProps) {
    const isGoogle = isGoogleNoteMetadata(note);

    const footerButtons = (
        <>
            {isGoogleNoteMetadata(note) && (
                <a
                    href={`https://docs.google.com/document/d/${note.googleDocId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
                >
                    <FaExternalLinkAlt className="mr-1" size={12} />
                    Open Google Doc
                </a>
            )}
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
        </>
    );

    const body = (
        <>
            <NoteTagManager note={note} className="mt-3" />
        </>
    );

    return (
        <BaseCard
            layout={layout}
            title={note.title}
            titleIcon={isGoogle ? <FaGoogle className="text-red-400 mr-2" size={18} /> : <FaFileAlt className="text-red-400 mr-2" size={18} />}
            createdAt={note.createdAt}
            updatedAt={note.updatedAt}
            body={body}
            footerButtons={footerButtons}
            accentClassName={isGoogle ? 'border-red-500' : undefined}
        />
    );
}

