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
type LayoutMode = 'grid' | 'list';
import { BaseCard } from './base-card';
import { DeleteNoteButton } from './delete-note-button';
import { JsonModal } from './json-modal';
import { NoteTagManager } from './note-tag-manager';

interface NoteCardProps {
  note: NoteMetadata;
  layout?: LayoutMode;
}

export function NoteCard({ note, layout = 'grid' }: NoteCardProps) {
  const isGoogle = isGoogleNoteMetadata(note);
  const [showJson, setShowJson] = useState(false);
  const metadata = useMemo(() => note, [note]);

  const footerButtons = (
    <>
      {isGoogleNoteMetadata(note) && (
        <a
          href={`https://docs.google.com/document/d/${note.googleDocId}/edit`}
          target="_blank"
          rel="noreferrer"
          className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
        >
          <FaExternalLinkAlt className="mr-1" size={12} />
          Open Google Doc
        </a>
      )}
      <Link
        href={`/note/${note.id}/view`}
        className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
      >
        <FaEye className="mr-1" size={12} />
        View
      </Link>
      <Link
        href={`/note/${note.id}/edit`}
        className="py-1 px-3 border border-gray-600 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
      >
        <FaEdit className="mr-1" size={12} />
        Edit
      </Link>
      <DeleteNoteButton noteId={note.id} title={note.title} />
    </>
  );

  const headerExtra = (
    <div className="flex items-center gap-2 flex-wrap">
      {(note.tags || []).map((tag) => (
        <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
          {tag}
        </span>
      ))}
      {(note.tags || []).length === 0 && <span className="text-xs text-gray-500">No tags</span>}
      <button
        onClick={() => setShowJson(true)}
        className="py-1 px-2 border border-gray-600 rounded text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center"
        title="View metadata JSON"
      >
        <FaInfoCircle className="mr-1" size={12} /> JSON
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
            <FaGoogle className="text-red-400 mr-2" size={18} />
          ) : (
            <FaFileAlt className="text-red-400 mr-2" size={18} />
          )
        }
        createdAt={note.createdAt}
        updatedAt={note.updatedAt}
        headerExtra={headerExtra}
        footerButtons={footerButtons}
        accentClassName={isGoogle ? 'border-red-500' : undefined}
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
