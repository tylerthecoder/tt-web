'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import {
  FaEdit,
  FaExternalLinkAlt,
  FaEye,
  FaFileAlt,
  FaGoogle,
  FaInfoCircle,
} from 'react-icons/fa';
import { isGoogleNoteMetadata, NoteMetadata } from 'tt-services/src/client-index';

import { BaseCard } from './base-card';
import { DeleteNoteButton } from './delete-note-button';
import { JsonModal } from './json-modal';

type LayoutMode = 'grid' | 'list';

interface NoteCardProps {
  note: NoteMetadata;
  layout?: LayoutMode;
}

const getActionClassName = (layout: LayoutMode) =>
  `inline-flex items-center gap-1.5 rounded-md border border-gray-600/90 font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
    layout === 'list' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm'
  }`;

export function NoteCard({ note, layout = 'grid' }: NoteCardProps) {
  const isGoogle = isGoogleNoteMetadata(note);
  const [showJson, setShowJson] = useState(false);
  const metadata = useMemo(() => note, [note]);
  const tags = note.tags || [];
  const actionClassName = getActionClassName(layout);
  const visibleTags = tags.slice(0, layout === 'grid' ? 2 : 2);
  const hiddenTagCount = Math.max(tags.length - visibleTags.length, 0);

  const footerButtons = (
    <>
      {isGoogleNoteMetadata(note) && (
        <a
          href={`https://docs.google.com/document/d/${note.googleDocId}/edit`}
          target="_blank"
          rel="noreferrer"
          className={actionClassName}
        >
          <FaExternalLinkAlt size={12} />
          Open
        </a>
      )}
      <Link href={`/note/${note.id}/view`} className={actionClassName}>
        <FaEye size={12} />
        View
      </Link>
      <Link href={`/note/${note.id}/edit`} className={actionClassName}>
        <FaEdit size={12} />
        Edit
      </Link>
      <DeleteNoteButton noteId={note.id} title={note.title} dense={layout === 'list'} />
    </>
  );

  const headerExtra = (
    <div className="flex max-w-full items-center gap-2">
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className={`truncate rounded bg-gray-700/80 font-medium text-gray-300 ${
              layout === 'list'
                ? 'max-w-[7rem] px-1.5 py-0.5 text-[10px]'
                : 'max-w-[10rem] px-2 py-1 text-[11px]'
            }`}
            title={tag}
          >
            {tag}
          </span>
        ))}
        {hiddenTagCount > 0 && (
          <span
            className={`rounded bg-gray-700/60 font-medium text-gray-400 ${
              layout === 'list' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
            }`}
          >
            +{hiddenTagCount}
          </span>
        )}
      </div>
      {tags.length === 0 && <span className="text-xs text-gray-500">No tags</span>}
      <button
        onClick={() => setShowJson(true)}
        className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-600/90 font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          layout === 'list' ? 'h-7 px-1.5 text-xs' : 'h-7 px-2 text-xs'
        }`}
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
        title={note.title}
        titleIcon={
          isGoogle ? (
            <FaGoogle size={layout === 'list' ? 14 : 18} aria-hidden />
          ) : (
            <FaFileAlt size={layout === 'list' ? 14 : 18} aria-hidden />
          )
        }
        typeLabel={isGoogle ? 'Google Doc' : 'Note'}
        createdAt={note.createdAt}
        updatedAt={note.updatedAt}
        headerExtra={headerExtra}
        footerButtons={footerButtons}
      />
      <JsonModal
        open={showJson}
        onClose={() => setShowJson(false)}
        title="Note Metadata"
        data={metadata}
      />
    </>
  );
}
