'use client';

import React, { useState } from 'react';
import { formatDistance } from 'date-fns';
import { useRouter } from 'next/navigation';
import { syncGoogleDoc } from '../google/docs/actions';
import { FaGoogle, FaExternalLinkAlt, FaSync, FaCheck } from 'react-icons/fa';
import { TagManager } from './TagManager';
import { LayoutMode } from '../notes/NotesPageClient';
import { GoogleNote } from 'tt-services/src/client-index';

interface GoogleDocCardProps {
    id: string;
    name: string;
    webViewLink?: string;
    createdTime?: string;
    modifiedTime?: string;
    isSynced: boolean;
    syncedDoc?: GoogleNote;
    availableTags: string[];
    layout?: LayoutMode;
}

export function GoogleDocCard({
    id,
    name,
    webViewLink,
    createdTime,
    modifiedTime,
    isSynced,
    syncedDoc,
    availableTags,
    layout = 'grid'
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

    const renderSyncButton = () => (
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
    );

    const renderOpenButton = () => (
        <button
            className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
            onClick={() => window.open(webViewLink, '_blank')}
            disabled={!webViewLink}
        >
            <FaExternalLinkAlt className="mr-1" size={12} />
            Open
        </button>
    );

    if (layout === 'grid') {
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
                    {renderOpenButton()}
                    {renderSyncButton()}
                </div>
            </div>
        );
    }

    // List layout
    return (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row border-l-4 border-red-500">
            <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700">
                <div className="flex items-center mb-2">
                    <FaGoogle className="text-red-400 mr-2" size={18} />
                    <h3 className="text-xl font-semibold text-red-400">{name}</h3>
                </div>
                {modifiedTime && (
                    <p className="text-sm text-gray-400">
                        Last modified {formatDistance(new Date(modifiedTime), new Date(), { addSuffix: true })}
                    </p>
                )}
                {createdTime && (
                    <p className="text-sm text-gray-400 mt-1">
                        Created {formatDistance(new Date(createdTime), new Date(), { addSuffix: true })}
                    </p>
                )}

                {syncedDoc ? (
                    <div className="mt-4">
                        <TagManager
                            itemId={syncedDoc.id}
                            tags={syncedDoc.tags}
                            availableTags={availableTags}
                        />
                    </div>
                ) : (
                    <div className="mt-4 text-xs text-gray-500">
                        Sync document to add tags
                    </div>
                )}
            </div>

            <div className="p-4 flex-grow flex flex-col">
                {error && (
                    <p className="text-sm text-red-500 mb-2">{error}</p>
                )}

                <div className="flex-grow">
                    <div className="flex items-center text-gray-300 text-sm mb-2">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">Google Document</span>
                        {syncedDoc ? (
                            <span className="text-green-400">Synced to notes</span>
                        ) : (
                            <span className="text-gray-500">Not synced</span>
                        )}
                    </div>

                    {webViewLink && (
                        <p className="text-gray-400 text-sm truncate mb-2">
                            <span className="text-gray-500">Link:</span> {webViewLink}
                        </p>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    {renderOpenButton()}
                    {renderSyncButton()}
                </div>
            </div>
        </div>
    );
}