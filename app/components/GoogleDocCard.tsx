'use client';

import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { useRouter } from 'next/navigation';
import { syncGoogleDoc } from '../google/docs/actions';
import { GoogleNote } from 'tt-services/src/services/GoogleNoteService';
import { FaGoogle, FaExternalLinkAlt, FaSync, FaCheck } from 'react-icons/fa';
import { TagManager } from './TagManager';

interface GoogleDocCardProps {
    id: string;
    name: string;
    webViewLink?: string;
    createdTime?: string;
    modifiedTime?: string;
    isSynced: boolean;
    syncedDoc?: GoogleNote;
    availableTags: string[];
}

export function GoogleDocCard({
    id,
    name,
    webViewLink,
    createdTime,
    modifiedTime,
    isSynced,
    syncedDoc,
    availableTags
}: GoogleDocCardProps) {
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(isSynced);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        setSyncing(true);
        setError(null);

        try {
            // Call the server action instead of fetch API
            const result = await syncGoogleDoc(id);

            if (!result.success) {
                throw new Error(result.error || 'Failed to sync document');
            }

            setSynced(true);

            // Refresh the page after syncing to update the list
            setTimeout(() => {
                router.refresh();
            }, 1000); // Give a short delay to show the synced state
        } catch (err) {
            console.error('Error syncing document:', err);
            setError(err instanceof Error ? err.message : 'Failed to sync document');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col border-l-4 border-red-500">
            <div className="p-4 border-b border-gray-700 flex items-start">
                <div className="flex-grow">
                    <div className="flex items-center">
                        <FaGoogle className="text-red-400 mr-2" size={18} />
                        <h3 className="text-xl font-semibold text-red-400 line-clamp-2">{name}</h3>
                    </div>
                    {modifiedTime && (
                        <p className="text-sm text-gray-400 mt-1">
                            Last modified {formatDistance(new Date(modifiedTime), new Date(), { addSuffix: true })}
                        </p>
                    )}
                </div>
            </div>
            <div className="p-4 flex-grow">
                {error && (
                    <p className="text-sm text-red-500 mb-2">{error}</p>
                )}
                {createdTime && (
                    <p className="text-sm text-gray-400">
                        Created {formatDistance(new Date(createdTime), new Date(), { addSuffix: true })}
                    </p>
                )}

                {/* Replace the old tag display with TagManager */}
                {syncedDoc ? (
                    <TagManager
                        itemId={syncedDoc.id}
                        tags={syncedDoc.tags}
                        availableTags={availableTags}
                        className="mt-3"
                    />
                ) : (
                    <div className="mt-3 text-xs text-gray-500">
                        Sync document to add tags
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-950 flex justify-end gap-2">
                <button
                    className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
                    onClick={() => window.open(webViewLink, '_blank')}
                    disabled={!webViewLink}
                >
                    <FaExternalLinkAlt className="mr-1" size={12} />
                    Open
                </button>

                <button
                    className={`py-1 px-3 rounded text-sm flex items-center border ${synced
                        ? 'text-gray-400 border-gray-600 hover:bg-gray-800'
                        : 'text-white border-blue-600 hover:bg-blue-900'
                        }`}
                    onClick={handleSync}
                    disabled={syncing || synced}
                >
                    {syncing ? (
                        <>
                            <span className="mr-1 h-3 w-3 inline-block rounded-full border-t-2 border-gray-500 animate-spin"></span>
                            Syncing...
                        </>
                    ) : synced ? (
                        <>
                            <FaCheck className="mr-1" size={12} />
                            Synced
                        </>
                    ) : (
                        <>
                            <FaSync className="mr-1" size={12} />
                            Sync
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}