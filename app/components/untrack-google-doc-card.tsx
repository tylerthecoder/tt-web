'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { FaCheck, FaExternalLinkAlt, FaGoogle, FaSync } from 'react-icons/fa';

import { trackGoogleDoc } from '../google/docs/actions';
type LayoutMode = 'grid' | 'list';
import type { GoogleDriveFile } from '../types/google';
import { BaseCard } from './base-card';

interface UntrackedGoogleDocCardProps {
  doc: GoogleDriveFile;
  layout?: LayoutMode;
}

export function UntrackedGoogleDocCard({ doc, layout = 'grid' }: UntrackedGoogleDocCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = doc.id ?? '';
  const name = doc.name ?? '';
  const webViewLink = doc.webViewLink ?? '';
  const createdTime = doc.createdTime ?? '';
  const modifiedTime = doc.modifiedTime ?? '';

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const result = await trackGoogleDoc(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync document');
      }
      setIsTracking(true);
      setTimeout(() => {
        router.refresh();
      }, 750);
    } catch (err) {
      console.error('Error syncing document:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync document');
    } finally {
      setSyncing(false);
    }
  };

  const openButton = (
    <button
      className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
      onClick={() => webViewLink && window.open(webViewLink, '_blank')}
      disabled={!webViewLink}
    >
      <FaExternalLinkAlt className="mr-1" size={12} />
      Open
    </button>
  );

  const syncButton = (
    <button
      className={`py-1 px-3 rounded text-sm flex items-center border ${
        isTracking
          ? 'text-gray-400 border-gray-600 hover:bg-gray-800'
          : 'text-white border-blue-600 hover:bg-blue-900'
      }`}
      onClick={handleSync}
      disabled={syncing || isTracking}
    >
      {syncing ? (
        <>
          <span className="mr-1 h-3 w-3 inline-block rounded-full border-t-2 border-gray-500 animate-spin"></span>
          Syncing...
        </>
      ) : isTracking ? (
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

  const bodyContent = (
    <>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="flex items-center text-gray-300 text-sm mb-2">
        <span className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">Google Document</span>
        <span className="text-gray-500">Not synced</span>
      </div>
      {webViewLink && (
        <p className="text-gray-400 text-sm truncate mb-2">
          <span className="text-gray-500">Link:</span> {webViewLink}
        </p>
      )}
      <div className="mt-3 text-xs text-gray-500">Sync document to add tags</div>
    </>
  );

  return (
    <BaseCard
      layout={layout}
      title={name}
      titleIcon={<FaGoogle className="text-red-400 mr-2" size={18} />}
      createdAt={createdTime ?? undefined}
      updatedAt={modifiedTime ?? undefined}
      body={bodyContent}
      footerButtons={
        <>
          {openButton}
          {syncButton}
        </>
      }
      accentClassName={'border-red-500'}
    />
  );
}
