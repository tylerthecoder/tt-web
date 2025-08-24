'use client';

import { format } from 'date-fns';
import React, { useState, useTransition } from 'react';
import { FaTrash } from 'react-icons/fa';

import { deleteJotAction } from '../actions';
import { useJots } from '../hooks';

export default function JotsPage() {
  const jotsQuery = useJots();
  const [jots, setJots] = useState(jotsQuery.data || []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (jotId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteJotAction(jotId);
      if (result?.error) {
        setError(result.error);
      } else {
        setJots((currentJots) => currentJots.filter((jot) => jot.id !== jotId));
      }
    });
  };

  React.useEffect(() => {
    if (jotsQuery.data) setJots(jotsQuery.data);
  }, [jotsQuery.data]);

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Jots</h1>
      </div>
      {error && <div className="bg-red-700 text-red-100 p-2 rounded mb-4">Error: {error}</div>}
      {!jotsQuery.data ? (
        <div className="flex items-center gap-3 text-gray-300">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full" />
          <span>Loading…</span>
        </div>
      ) : jots.length === 0 ? (
        <p className="text-gray-400">No jots yet. Add some using the /jot page!</p>
      ) : (
        <ul className="space-y-3">
          {jots.map((jot) => (
            <li key={jot.id} className="flex items-start justify-between p-3 bg-gray-700 rounded">
              <div className="flex-1 mr-3">
                <p className="text-gray-100 break-words whitespace-pre-wrap">{jot.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(jot.createdAt), 'PPpp')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(jot.id)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Jot"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
