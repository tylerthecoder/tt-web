'use client';

import React, { useEffect, useState } from 'react';

import { getGoogleDriveFileById } from '@/google/docs/actions';
import type { GoogleDriveFile } from '@/types/google';

import { UntrackedGoogleDocCard } from './untrack-google-doc-card';

interface Props {
  docId: string;
  layout?: 'grid' | 'list';
}

export function UntrackedGoogleDocCardLoader({ docId, layout = 'grid' }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<GoogleDriveFile | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      try {

        setLoading(true);
        setError(null);
        const res = await getGoogleDriveFileById(docId);
        if (!res.success) {
          throw new Error(res.error || 'Failed to load Google Doc');
        }
        if (isMounted) setDoc(res.file || null);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Failed to load Google Doc');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [docId]);

  if (loading) {
    return (
      <div className="border border-gray-700 rounded p-4 bg-gray-900 animate-pulse">
        <div className="flex items-center mb-3">
          <div className="h-5 w-5 bg-gray-700 rounded mr-2" />
          <div className="h-5 bg-gray-700 rounded w-1/2" />
        </div>
        <div className="text-gray-400 text-sm mb-4">
          <div className="h-3 bg-gray-800 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-1/4" />
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-8 w-16 bg-gray-800 rounded" />
          <div className="h-8 w-20 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-700 rounded p-4 text-red-400">
        Failed to load document: {error}
      </div>
    );
  }

  if (!doc) return null;

  return <UntrackedGoogleDocCard doc={doc} layout={layout} />;
}


