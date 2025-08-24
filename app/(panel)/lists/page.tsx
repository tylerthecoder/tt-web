"use client";

import React, { useState } from 'react';
import { AddItemForm } from '@/components/add-item-form';
import { FaArrowLeft, FaList } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useLists } from '../hooks';
import { List } from 'tt-services';
import { ListItem } from '@/components/list-item';

export default function ListsPage() {
    const listsQuery = useLists();
    const [selectedList, setSelectedList] = useState<List | null>(null);
    const router = useRouter();

    if (selectedList) {
        return (
            <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gray-700 border-b border-gray-600">
                    <button
                        onClick={() => setSelectedList(null)}
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold text-white truncate">{selectedList.name}</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <AddItemForm listId={selectedList.id} />

                    <div className="mt-6 space-y-3">
                        {selectedList.items.map((item) => (
                            <ListItem
                                key={item.id}
                                item={item}
                                listId={selectedList.id}
                            />
                        ))}
                    </div>

                    {selectedList.items.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">No items in this list yet.</p>
                            <p className="text-gray-500 text-sm mt-2">Add your first item above.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-gray-700 border-b border-gray-600">
                <FaList className="text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Lists</h1>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                {!listsQuery.data ? (
                    <div className="text-center py-12 text-gray-400">Loading…</div>
                ) : listsQuery.data.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No lists found.</p>
                        <p className="text-gray-500 text-sm mt-2">Create your first list to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-full">
                        {listsQuery.data.map((list) => (
                            <div
                                key={list.id}
                                onClick={() => router.push(`/list/${list.id}`)}
                                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 hover:bg-gray-750 transition-colors cursor-pointer min-w-0"
                            >
                                <div className="flex items-center gap-2 mb-3 min-w-0">
                                    <FaList className="text-blue-400 flex-shrink-0" size={16} />
                                    <h3 className="text-lg font-semibold text-white truncate flex-1 min-w-0">{list.name}</h3>
                                </div>

                                <div className="text-sm text-gray-400 mb-2">
                                    {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                                </div>

                                {list.items.length > 0 && (
                                    <div className="space-y-1">
                                        {list.items.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 text-xs text-gray-300 min-w-0">
                                                <div className={`w-3 h-3 flex-shrink-0 rounded border ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}></div>
                                                <span className={`${item.checked ? 'line-through text-gray-500' : ''} truncate flex-1 min-w-0`}>
                                                    {item.content}
                                                </span>
                                            </div>
                                        ))}
                                        {list.items.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                                +{list.items.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


