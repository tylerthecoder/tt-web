'use client';

import React from 'react';

import { useGoogleDriveFileById } from '@/(panel)/hooks';

import { UntrackedGoogleDocCard } from './untrack-google-doc-card';

interface Props {
  docId: string;
  layout?: 'grid' | 'list';
}

export function UntrackedGoogleDocCardLoader({ docId, layout = 'grid' }: Props) {
  const { data: doc, isLoading, error } = useGoogleDriveFileById(docId);

  if (isLoading) {
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
        Failed to load document: {error instanceof Error ? error.message : 'Error'}
      </div>
    );
  }

  if (!doc) return null;

  return <UntrackedGoogleDocCard doc={doc} layout={layout} />;
}
