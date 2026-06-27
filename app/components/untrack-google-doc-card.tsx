'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { FaCheck, FaExternalLinkAlt, FaGoogle, FaInfoCircle, FaSync } from 'react-icons/fa';

import { trackGoogleDoc } from '../google/docs/actions';
import type { GoogleDriveFile } from '../types/google';
import { BaseCard } from './base-card';
import { JsonModal } from './json-modal';

type LayoutMode = 'grid' | 'list';

interface UntrackedGoogleDocCardProps {
  doc: GoogleDriveFile;
  layout?: LayoutMode;
}

const getActionClassName = (layout: LayoutMode) =>
  `inline-flex items-center gap-1.5 rounded-md border border-gray-600/90 font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${
    layout === 'list' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm'
  }`;

export function UntrackedGoogleDocCard({ doc, layout = 'grid' }: UntrackedGoogleDocCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const metadata = useMemo(() => doc, [doc]);

  const id = doc.id ?? '';
  const name = doc.name ?? '';
  const webViewLink = doc.webViewLink ?? '';
  const createdTime = doc.createdTime ?? '';
  const modifiedTime = doc.modifiedTime ?? '';
  const actionClassName = getActionClassName(layout);

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
      className={actionClassName}
      onClick={() => webViewLink && window.open(webViewLink, '_blank')}
      disabled={!webViewLink}
      title="Open Google Doc"
    >
      <FaExternalLinkAlt size={12} />
      Open
    </button>
  );

  const syncButton = (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${
        layout === 'list' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm'
      } ${
        isTracking
          ? 'border-gray-600/90 text-gray-400 hover:bg-gray-700/70'
          : 'border-blue-500 text-white hover:bg-blue-950/70'
      }`}
      onClick={handleSync}
      disabled={syncing || isTracking}
    >
      {syncing ? (
        <>
          <span className="inline-block h-3 w-3 rounded-full border-t-2 border-gray-500 animate-spin"></span>
          Syncing...
        </>
      ) : isTracking ? (
        <>
          <FaCheck size={12} />
          Synced
        </>
      ) : (
        <>
          <FaSync size={12} />
          Sync
        </>
      )}
    </button>
  );

  const headerExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowJson(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-gray-600/90 px-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        title="View metadata JSON"
      >
        <FaInfoCircle size={12} />
        <span className={layout === 'list' ? 'sr-only' : 'sr-only sm:not-sr-only'}>JSON</span>
      </button>
    </div>
  );

  return (
    <>
      <BaseCard
        layout={layout}
        title={name}
        titleIcon={<FaGoogle size={layout === 'list' ? 14 : 18} aria-hidden />}
        typeLabel="Google Doc"
        createdAt={createdTime ?? undefined}
        updatedAt={modifiedTime ?? undefined}
        headerExtra={headerExtra}
        footerButtons={
          <>
            {openButton}
            {syncButton}
          </>
        }
      />
      <JsonModal
        open={showJson}
        onClose={() => setShowJson(false)}
        title="Google Doc Metadata"
        data={metadata}
      />
      {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
    </>
  );
}
