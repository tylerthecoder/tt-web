'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { DailyNote } from 'tt-services/src/services/DailyNoteService';
import { NoteMetadata } from 'tt-services/src/services/NotesService';
import { MilkdownEditorWrapper } from './markdown-editor';
import { getNote as getNoteAction } from './actions';
import { FaArrowLeft, FaArrowRight, FaSpinner, FaBars, FaTimes } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';

interface DailyNoteViewerProps {
    initialNote: DailyNote;
    allNotesMetadata: NoteMetadata[]; // Assumes this is sorted descending by date
}

export function DailyNoteViewer({ initialNote, allNotesMetadata }: DailyNoteViewerProps) {
    const [currentNote, setCurrentNote] = useState<DailyNote | null>(initialNote);
    const [isPending, startTransition] = useTransition();
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Find the index of the initial note
    useEffect(() => {
        if (initialNote) {
            const index = allNotesMetadata.findIndex(meta => meta.id === initialNote.id);
            setCurrentIndex(index);
        }
    }, [initialNote, allNotesMetadata]);

    const fetchAndSetNote = useCallback((noteId: string) => {
        startTransition(async () => {
            const note = await getNoteAction(noteId);
            if (note) {
                // Ensure the fetched note has the 'day' property expected by DailyNote
                // If getNoteAction only returns Note, we might need to cast or adjust types
                setCurrentNote(note as DailyNote); // Adjust type if necessary
                const index = allNotesMetadata.findIndex(meta => meta.id === noteId);
                setCurrentIndex(index);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                }
            } else {
                // Handle error - note not found?
                console.error("Daily note not found:", noteId);
                // Maybe set currentNote to null or show an error state
            }
        });
    }, [allNotesMetadata]);

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (currentIndex === -1) return; // Should not happen if initialized correctly

        const targetIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;

        if (targetIndex >= 0 && targetIndex < allNotesMetadata.length) {
            const targetNoteId = allNotesMetadata[targetIndex].id;
            fetchAndSetNote(targetNoteId);
        }
    };

    const handleListClick = (noteId: string) => {
        if (noteId !== currentNote?.id) {
            fetchAndSetNote(noteId);
        }
    };

    const formatDate = (isoString: string) => {
        try {
            return format(parseISO(isoString.split('T')[0]), 'EEE, MMM d, yyyy');
        } catch (e) {
            return "Invalid Date";
        }
    };

    const isPrevDisabled = isPending || currentIndex >= allNotesMetadata.length - 1;
    const isNextDisabled = isPending || currentIndex <= 0;

    return (
        <div className="flex h-full bg-gray-900 text-white relative">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar List */}
            <div className={`
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:relative fixed left-0 top-0 h-full z-50
                w-80 md:w-1/4 border-r border-gray-700 overflow-y-auto flex flex-col bg-gray-900
                transition-transform duration-300 ease-in-out
            `}>
                <div className="flex items-center justify-between p-3 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                    <h2 className="text-lg font-semibold">Past Notes</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 text-gray-400 hover:text-white md:hidden"
                    >
                        <FaTimes />
                    </button>
                </div>
                <ul className="flex-grow">
                    {allNotesMetadata.map((meta, index) => (
                        <li key={meta.id}>
                            <button
                                onClick={() => handleListClick(meta.id)}
                                disabled={isPending}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors duration-150
                                    ${currentNote?.id === meta.id ? 'bg-blue-800 text-white' : 'text-gray-300'}
                                    ${isPending ? 'cursor-wait' : ''}`}
                            >
                                {formatDate(meta.date)} {/* Display formatted date */}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {currentNote ? (
                    <>
                        {/* Header with Navigation */}
                        <div className="flex justify-between items-center p-3 border-b border-gray-700 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="p-2 rounded hover:bg-gray-700 md:hidden"
                                >
                                    <FaBars />
                                </button>
                                <button
                                    onClick={() => handleNavigate('prev')}
                                    disabled={isPrevDisabled}
                                    className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaArrowLeft />
                                </button>
                            </div>
                            <h2 className="text-xl font-semibold text-center flex-1">
                                {formatDate(currentNote.date)}
                                {isPending && <FaSpinner className="animate-spin inline ml-2" />}
                            </h2>
                            <button
                                onClick={() => handleNavigate('next')}
                                disabled={isNextDisabled}
                                className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FaArrowRight />
                            </button>
                        </div>

                        {/* Editor */}
                        <div className="flex-grow overflow-hidden relative">
                            {isPending && (
                                <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-10">
                                    <FaSpinner className="animate-spin text-4xl" />
                                </div>
                            )}
                            <MilkdownEditorWrapper noteId={currentNote.id} hideTitle={true} key={currentNote.id} />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="mb-4 p-3 rounded bg-gray-700 hover:bg-gray-600 md:hidden"
                        >
                            <FaBars className="text-xl" />
                        </button>
                        {isPending ? <FaSpinner className="animate-spin text-4xl" /> : 'Select a note'}
                    </div>
                )}
            </div>
        </div>
    );
}