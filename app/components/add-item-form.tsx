'use client';

import { useState } from 'react';

import { addItemToList } from '@/(panel)/actions';


interface AddItemFormProps {
  listId: string;
}

export function AddItemForm({ listId }: AddItemFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addItemToList(listId, content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-grow px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        placeholder="Add new item"
      />
      <button
        type="submit"
        className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Add
      </button>
    </form>
  );
}
