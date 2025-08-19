'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NoteCard } from "../components/note-card";
import { UntrackedGoogleDocCard } from "../components/untrack-google-doc-card.tsx";
import { NotesFilter } from "../components/NotesFilter";
import { FaThLarge, FaList } from 'react-icons/fa';
import { DisplayItem } from './page.tsx';

export type LayoutMode = 'grid' | 'list';

interface NotesPageClientProps {
    displayItems: DisplayItem[];
    initialSearch: string;
    initialShownTags: string[];
    initialHiddenTags: string[];
    showGoogleNotice: boolean;
}

export function NotesPageClient({
    displayItems,
    initialSearch,
    initialShownTags,
    initialHiddenTags,
    showGoogleNotice
}: NotesPageClientProps) {
    const [filteredItems, setFilteredItems] = useState<DisplayItem[]>(displayItems);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

    // Initialize layout from localStorage if available
    useEffect(() => {
        const savedLayout = localStorage.getItem('notesLayoutMode');
        if (savedLayout === 'grid' || savedLayout === 'list') {
            setLayoutMode(savedLayout);
        }
    }, []);

    // Save layout preference to localStorage
    useEffect(() => {
        localStorage.setItem('notesLayoutMode', layoutMode);
    }, [layoutMode]);

    const toggleLayout = () => {
        setLayoutMode(prev => prev === 'grid' ? 'list' : 'grid');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Notes</h1>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={toggleLayout}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                        title={`Switch to ${layoutMode === 'grid' ? 'list' : 'grid'} view`}
                    >
                        {layoutMode === 'grid' ? (
                            <FaList className="text-gray-300" size={20} />
                        ) : (
                            <FaThLarge className="text-gray-300" size={20} />
                        )}
                    </button>
                    <Link
                        href="/notes/create"
                        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create Note
                    </Link>
                </div>
            </div>

            {showGoogleNotice && (
                <div className="bg-yellow-800 text-yellow-100 p-4 mb-6 rounded-lg">
                    <p>Connect your Google account to view and sync your Google Docs.</p>
                </div>
            )}

            <NotesFilter
                items={displayItems}
                setFilteredItems={setFilteredItems}
            />

            {layoutMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="h-full">
                            {item.type === 'note' ? (
                                <NoteCard
                                    note={item.originalItem}
                                    layout="grid"
                                />
                            ) : (
                                <UntrackedGoogleDocCard
                                    doc={item.originalItem}
                                    layout="grid"
                                />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredItems.map((item) => (
                        <div key={`${item.type}-${item.id}`}>
                            {item.type === 'note' ? (
                                <NoteCard
                                    note={item.originalItem}
                                    layout="list"
                                />
                            ) : (
                                <UntrackedGoogleDocCard
                                    doc={item.originalItem}
                                    layout="list"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">
                        {displayItems.length === 0 ?
                            "No notes or documents found." :
                            "No items match your current filters."}
                    </p>
                </div>
            )}
        </div>
    );
}