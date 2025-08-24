'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useNotesIndex } from "../hooks";
import { NotesFilter } from '@/components/NotesFilter';
import { NoteCard } from '@/components/note-card';
import { UntrackedGoogleDocCard } from '@/components/untrack-google-doc-card';
import { FaThLarge, FaList } from 'react-icons/fa';

type LayoutMode = 'grid' | 'list';

export default function NotesPage() {
    const { data, isLoading } = useNotesIndex();
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
    const [filteredItems, setFilteredItems] = useState<any[]>([]);

    const displayItems = useMemo(() => {
        if (!data) return [] as any[];
        const items: any[] = [];
        data.notes.forEach(note => {
            items.push({
                id: note.id,
                title: note.title,
                modifiedTime: note.updatedAt || note.createdAt || new Date().toISOString(),
                type: 'note',
                originalItem: note,
            });
        });
        data.googleDocs.forEach(doc => {
            items.push({
                id: doc.id || '',
                title: doc.name || '',
                modifiedTime: doc.modifiedTime || new Date().toISOString(),
                type: 'google-doc',
                originalItem: doc,
            });
        });
        items.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
        return items;
    }, [data]);

    const toggleLayout = () => setLayoutMode(prev => (prev === 'grid' ? 'list' : 'grid'));

    if (isLoading) return <div className="p-4 text-gray-300">Loading notes…</div>;

    return (
        <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={toggleLayout}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                        title={`Switch to ${layoutMode === 'grid' ? 'list' : 'grid'} view`}
                    >
                        {layoutMode === 'grid' ? (
                            <FaList className="text-gray-300" size={18} />
                        ) : (
                            <FaThLarge className="text-gray-300" size={18} />
                        )}
                    </button>
                    <Link
                        href="/notes/create"
                        className="bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Create Note
                    </Link>
                </div>
            </div>

            {data?.showGoogleNotice && (
                <div className="bg-yellow-800 text-yellow-100 p-3 mb-4 rounded-lg text-sm">
                    Connect your Google account to view and sync your Google Docs.
                </div>
            )}

            <NotesFilter items={displayItems} setFilteredItems={setFilteredItems} />

            {layoutMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="h-full">
                            {item.type === 'note' ? (
                                <NoteCard note={item.originalItem} layout="grid" />
                            ) : (
                                <UntrackedGoogleDocCard doc={item.originalItem} layout="grid" />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredItems.map((item) => (
                        <div key={`${item.type}-${item.id}`}>
                            {item.type === 'note' ? (
                                <NoteCard note={item.originalItem} layout="list" />
                            ) : (
                                <UntrackedGoogleDocCard doc={item.originalItem} layout="list" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    {displayItems.length === 0 ? 'No notes or documents found.' : 'No items match your current filters.'}
                </div>
            )}
        </div>
    );
}