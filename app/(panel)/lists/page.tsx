'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { FaList } from 'react-icons/fa';

import CreateListForm from '@/components/create-list-form';
import ListCard from '@/components/list-card';

import { useLists } from '../hooks';

export default function ListsPage() {
  const listsQuery = useLists();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <FaList className="text-blue-400" />
          <h1 className="text-2xl md:text-3xl font-bold">Lists</h1>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Add List
        </button>
      </div>

      <div className="">
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
              <Link
                key={list.id}
                href={`/list/${list.id}`}
                className="block hover:border-gray-600 hover:bg-gray-750 transition-colors min-w-0"
              >
                <ListCard list={list} />
              </Link>
            ))}
          </div>
        )}
      </div>
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create List</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1 text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <CreateListForm
              onSuccess={(list) => {
                setIsCreateOpen(false);
                router.push(`/list/${list.id}`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
