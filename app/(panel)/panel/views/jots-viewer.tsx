'use client';

import React, { useState, useTransition } from 'react';
import { deleteJotAction } from '../actions';
import { FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import { useJots } from '../hooks';

export default function JotsViewer() {
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
                setJots(currentJots => currentJots.filter(jot => jot.id !== jotId));
            }
        });
    };

    React.useEffect(() => {
        if (jotsQuery.data) setJots(jotsQuery.data);
    }, [jotsQuery.data]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">My Jots</h2>
            {error && (
                <div className="bg-red-700 text-red-100 p-2 rounded mb-4">
                    Error: {error}
                </div>
            )}
            {!jotsQuery.data ? (
                <p className="text-gray-400">Loading…</p>
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



