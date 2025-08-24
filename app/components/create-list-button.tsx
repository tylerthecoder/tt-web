'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createList } from '@/(panel)/actions';

export function CreateListButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const list = await createList(name);
    setIsCreating(false);
    setName('');
    router.push(`/list/${list.id}`);
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Create List
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        placeholder="List name"
        autoFocus
      />
      <button
        type="submit"
        className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => setIsCreating(false)}
        className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
