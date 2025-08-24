'use client';

import React, { useState } from 'react';

import { createList } from '@/(panel)/actions';

interface CreateListFormProps {
  onSuccess?: (list: any) => void;
}

export default function CreateListForm({ onSuccess }: CreateListFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const list = await createList(name.trim());
      if (onSuccess) onSuccess(list);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="listName" className="block text-white text-sm font-bold mb-2">
          List name
        </label>
        <input
          id="listName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="e.g. Groceries"
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  );
}
