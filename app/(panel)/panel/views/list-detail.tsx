'use client';

import React from 'react';
import { useList } from '../hooks';
import { AddItemForm } from '@/components/add-item-form';
import { ListItem } from '@/components/list-item';
import { FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ListDetail({ listId }: { listId: string }) {
    const { data: list, isLoading } = useList(listId);
    const router = useRouter();

    if (isLoading) return <div className="p-4 text-gray-300">Loading…</div>;
    if (!list) return <div className="p-4 text-gray-400">List not found</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-gray-700 border-b border-gray-600">
                <button
                    onClick={() => router.push('/panel/lists')}
                    className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
                >
                    <FaArrowLeft />
                </button>
                <h1 className="text-2xl font-bold text-white truncate">{list.name}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <AddItemForm listId={list.id} />

                <div className="mt-6 space-y-3">
                    {list.items.map((item) => (
                        <ListItem
                            key={item.id}
                            item={item}
                            listId={list.id}
                        />
                    ))}
                </div>

                {list.items.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No items in this list yet.</p>
                        <p className="text-gray-500 text-sm mt-2">Add your first item above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


