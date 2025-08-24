'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { FaCheckCircle, FaEye, FaEyeSlash, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import type { Note } from 'tt-services/src/client-index.ts';

import { publishNote, unpublishNote } from '@/(panel)/actions';

interface PublishControlsProps {
  note: Note;
  className?: string;
}

export function PublishControls({ note, className = '' }: PublishControlsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPublished = !!note.published;

  const status = useMemo(() => {
    return isPublished ? (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <FaCheckCircle size={10} /> Published
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <FaTimesCircle size={10} /> Unpublished
      </span>
    );
  }, [isPublished]);

  const togglePublish = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    setError(null);
    try {
      if (isPublished) {
        await unpublishNote(note.id);
      } else {
        await publishNote(note.id);
      }
      // Reload to reflect new published state in the editor header and any SSR bits
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle publish state');
    } finally {
      setIsPending(false);
    }
  }, [isPublished, isPending, note.id]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status}
      <button
        onClick={togglePublish}
        disabled={isPending}
        className={`text-xs underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${isPublished ? 'text-yellow-400 hover:text-yellow-300' : 'text-blue-400 hover:text-blue-300'
          }`}
        title={isPublished ? 'Unpublish this note' : 'Publish this note'}
      >
        {isPending ? (
          <FaSpinner className="animate-spin" size={10} />
        ) : isPublished ? (
          <FaEyeSlash size={10} />
        ) : (
          <FaEye size={10} />
        )}
        {isPublished ? 'Unpublish' : 'Publish'}
      </button>

      {error && (
        <span className="text-xs text-red-400" title={error}>
          {error.substring(0, 40)}...
        </span>
      )}
    </div>
  );
}


