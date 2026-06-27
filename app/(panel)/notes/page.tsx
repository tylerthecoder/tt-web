'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { FaList, FaThLarge } from 'react-icons/fa';

import { NoteCard } from '@/components/note-card';
import { NotesFilter } from '@/components/NotesFilter';
import { UntrackedGoogleDocCard } from '@/components/untrack-google-doc-card';

import { useNotesIndex } from '../hooks';

export type LayoutMode = 'grid' | 'list';

export default function NotesPage() {
  const router = useRouter();
  const { data, isLoading } = useNotesIndex();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  const displayItems = useMemo(() => {
    if (!data) return [] as any[];
    const items: any[] = [];
    data.notes.forEach((note) => {
      items.push({
        id: note.id,
        title: note.title,
        modifiedTime: note.updatedAt || note.createdAt || new Date().toISOString(),
        type: 'note',
        originalItem: note,
      });
    });
    data.googleDocs.forEach((doc) => {
      items.push({
        id: doc.id || '',
        title: doc.name || '',
        modifiedTime: doc.modifiedTime || new Date().toISOString(),
        type: 'google-doc',
        originalItem: doc,
      });
    });
    items.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
    return items;
  }, [data]);

  const toggleLayout = () => setLayoutMode((prev) => (prev === 'grid' ? 'list' : 'grid'));

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.closest('[role="textbox"]')
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === '/') {
        event.preventDefault();
        document.getElementById('notes-search-input')?.focus();
      }

      if (key === 'v') {
        event.preventDefault();
        setLayoutMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
      }

      if (key === 'n') {
        event.preventDefault();
        router.push('/notes/create');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (isLoading) return <div className="p-4 text-gray-300">Loading notes…</div>;

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <ShortcutKey label="/" text="Search" />
            <ShortcutKey label="V" text="View" />
            <ShortcutKey label="N" text="New" />
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={toggleLayout}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title={`Switch to ${layoutMode === 'grid' ? 'list' : 'grid'} view`}
              aria-label={`Switch to ${layoutMode === 'grid' ? 'list' : 'grid'} view`}
              aria-keyshortcuts="V"
            >
              {layoutMode === 'grid' ? (
                <FaList className="text-gray-300" size={16} />
              ) : (
                <FaThLarge className="text-gray-300" size={16} />
              )}
              <span>{layoutMode === 'grid' ? 'List' : 'Grid'}</span>
              <kbd className="rounded border border-gray-600 bg-gray-900 px-1.5 py-0.5 text-[10px] text-gray-400">
                V
              </kbd>
            </button>
            <Link
              href="/notes/create"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-keyshortcuts="N"
            >
              Create Note
              <kbd className="rounded border border-blue-300/40 bg-blue-950/40 px-1.5 py-0.5 text-[10px] text-blue-100">
                N
              </kbd>
            </Link>
          </div>
        </div>
      </div>

      {data?.showGoogleNotice && (
        <div className="bg-yellow-800 text-yellow-100 p-3 mb-4 rounded-lg text-sm">
          Connect your Google account to view and sync your Google Docs.
        </div>
      )}

      <NotesFilter items={displayItems} setFilteredItems={setFilteredItems} />

      {layoutMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="h-full">
              {item.type === 'note' ? (
                <NoteCard note={item.originalItem} layout="grid" />
              ) : (
                <UntrackedGoogleDocCard doc={item.originalItem} layout="grid" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredItems.map((item) => (
            <div key={`${item.type}-${item.id}`}>
              {item.type === 'note' ? (
                <NoteCard note={item.originalItem} layout="list" />
              ) : (
                <UntrackedGoogleDocCard doc={item.originalItem} layout="list" />
              )}
            </div>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {displayItems.length === 0
            ? 'No notes or documents found.'
            : 'No items match your current filters.'}
        </div>
      )}
    </div>
  );
}

function ShortcutKey({ label, text }: { label: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-800/80 px-2 py-1">
      <kbd className="font-mono text-[11px] text-gray-200">{label}</kbd>
      <span>{text}</span>
    </span>
  );
}
