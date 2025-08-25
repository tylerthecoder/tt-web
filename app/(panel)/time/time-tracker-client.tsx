'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import type { TimeBlock } from 'tt-services';

import { MilkdownEditor } from '@/components/milkdown-note-editor';
import { NoteModal } from '@/components/note-modal';

import { addTagToNote, createNote, endTimeBlock, getAllTimeBlocks, startTimeBlock, updateTimeBlock } from '../actions';

type UiBlock = TimeBlock & { durationMs: number };

export default function TimeTrackerClient() {
  const queryClient = useQueryClient();

  const [label, setLabel] = useState('');
  const [noteId, setNoteId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const toUiBlocks = (blocks: TimeBlock[]): UiBlock[] =>
    (blocks || []).map((b) => {
      const end = b.endTime ? new Date(b.endTime) : new Date();
      const dur = end.getTime() - new Date(b.startTime).getTime();
      return { ...b, durationMs: Math.max(0, dur) };
    });

  const allQuery = useQuery({
    queryKey: ['timeblocks', 'all'],
    queryFn: () => getAllTimeBlocks(),
    select: toUiBlocks,
    staleTime: 30_000,
  });

  const startMutation = useMutation({
    mutationFn: async ({ label, noteId }: { label: string; noteId?: string }) =>
      startTimeBlock(label, noteId || undefined),
    onMutate: async () => {
      setError(null);
    },
    onSettled: async () => {
      setLabel('');
      setNoteId('');
      await queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
    },
    onError: (e: any) => setError(e instanceof Error ? e.message : 'Failed to start time block'),
  });

  const endMutation = useMutation({
    mutationFn: async () => endTimeBlock(),
    onMutate: async () => setError(null),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
    },
    onError: (e: any) => setError(e instanceof Error ? e.message : 'Failed to end time block'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { startTime?: string; endTime?: string | null; noteId?: string | null } }) =>
      updateTimeBlock(id, updates),
    onMutate: async () => {
      setError(null);
    },
    onError: (e: any) => setError(e instanceof Error ? e.message : 'Failed to update time block'),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (block: UiBlock) => {
      const baseTitle = block.label || format(new Date(block.startTime), 'PPpp');
      const title = `Time Block - ${baseTitle}`;
      const note = await createNote(title);
      await addTagToNote(note.id, 'Time Block');
      await updateTimeBlock(block.id, { noteId: note.id });
      return note;
    },
    onSettled: async (note) => {
      await queryClient.invalidateQueries({ queryKey: ['timeblocks'] });
      const nid = (note as any)?.id as string | undefined;
      if (nid) setOpenNoteId(nid);
    },
  });

  const allBlocks = useMemo(() => allQuery.data || [], [allQuery.data]);

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Time Tracker</h1>
      </div>

      <div className="rounded-lg border border-white/10 bg-gray-800/50 backdrop-blur p-3 md:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="What are you working on?"
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-100"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && label.trim()) startMutation.mutate({ label: label.trim(), noteId: noteId.trim() || undefined });
            }}
          />
          <input
            type="text"
            placeholder="Optional Note ID"
            className="w-full md:w-60 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-gray-100"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && label.trim()) startMutation.mutate({ label: label.trim(), noteId: noteId.trim() || undefined });
            }}
          />
          <button
            onClick={() => label.trim() && startMutation.mutate({ label: label.trim(), noteId: noteId.trim() || undefined })}
            disabled={!label.trim() || startMutation.isPending}
            className="px-3 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
            title="Start time block"
          >
            <FaPlay /> Start
          </button>
          <button
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
            className="px-3 py-2 rounded bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 flex items-center gap-2"
            title="End current block"
          >
            <FaPause /> Stop
          </button>
        </div>
      </div>

      {error && <div className="bg-red-700 text-red-100 p-2 rounded mb-4">Error: {error}</div>}

      <div className="space-y-2">
        <div className="text-gray-300 font-medium">All Time Blocks</div>
        {allQuery.isLoading ? (
          <div className="flex items-center gap-3 text-gray-300">
            <span className="animate-spin inline-block w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full" />
            <span>Loading…</span>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 rounded bg-gray-800/40 max-h-[70vh] overflow-auto">
            {allBlocks.length === 0 ? (
              <li className="p-3 text-gray-400">No time blocks yet.</li>
            ) : (
              allBlocks.map((b) => (
                <li key={b.id} className="p-3">
                  <BlockRow
                    block={b}
                    onSave={(updates) => updateMutation.mutate({ id: b.id, updates })}
                    onStop={() => updateMutation.mutate({ id: b.id, updates: { endTime: new Date().toISOString() } })}
                    onAddNote={() => addNoteMutation.mutate(b)}
                    onOpenNote={() => b.noteId && setOpenNoteId(b.noteId)}
                    compact
                  />
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <NoteModal noteId={openNoteId} onClose={() => setOpenNoteId(null)} hideTitle title="Time Block Note" />
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    seconds > 0 || (hours === 0 && minutes === 0) ? `${seconds}s` : null,
  ].filter(Boolean);
  return parts.join(' ');
}

function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localInputToIso(local: string) {
  if (!local) return '';
  const d = new Date(local);
  return d.toISOString();
}

function BlockRow(
  {
    block,
    onSave,
    onStop,
    onAddNote,
    onOpenNote,
    compact = false,
  }: {
    block: UiBlock;
    onSave: (updates: { startTime?: string; endTime?: string | null; noteId?: string | null }) => void;
    onStop?: () => void;
    onAddNote?: () => void;
    onOpenNote?: () => void;
    compact?: boolean;
  },
) {
  const [isEditing, setIsEditing] = useState(false);
  const [startLocal, setStartLocal] = useState(() => isoToLocalInput(block.startTime));
  const [endLocal, setEndLocal] = useState(() => (block.endTime ? isoToLocalInput(block.endTime) : ''));
  const [noteId, setNoteId] = useState(block.noteId || '');

  const isActive = !block.endTime;

  const save = () => {
    const updates: { startTime?: string; endTime?: string | null; noteId?: string | null } = {};
    if (startLocal) updates.startTime = localInputToIso(startLocal);
    if (endLocal === '') updates.endTime = null; else updates.endTime = localInputToIso(endLocal);
    updates.noteId = noteId.trim() === '' ? null : noteId.trim();
    onSave(updates);
    setIsEditing(false);
  };

  const cancel = () => {
    setIsEditing(false);
    setStartLocal(isoToLocalInput(block.startTime));
    setEndLocal(block.endTime ? isoToLocalInput(block.endTime) : '');
    setNoteId(block.noteId || '');
  };

  const containerClass = compact
    ? isActive
      ? 'flex flex-col gap-2 rounded bg-green-800/50 border border-green-500'
      : 'flex flex-col gap-2'
    : isActive
      ? 'p-3 rounded flex flex-col gap-2 bg-green-800/50 border border-green-500'
      : 'p-3 bg-gray-700 rounded flex flex-col gap-2';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-gray-100 font-medium">{block.label}</div>
          <div className="text-xs text-gray-300">
            {format(new Date(block.startTime), 'PPpp')} — {block.endTime ? format(new Date(block.endTime), 'PPpp') : 'present'}
          </div>
          {block.noteId && !isEditing && (
            <div className="text-[10px] text-gray-300">Note: {block.noteId}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isActive && <span className="px-2 py-0.5 text-xs rounded bg-green-700 text-white">Active</span>}
          <div className="text-gray-200 whitespace-nowrap">{formatDuration(block.durationMs)}</div>
        </div>
      </div>
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <label className="text-xs text-gray-300 flex flex-col gap-1">
            <span>Start</span>
            <input
              type="datetime-local"
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </label>
          <label className="text-xs text-gray-300 flex flex-col gap-1">
            <span>End</span>
            <input
              type="datetime-local"
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </label>
          <label className="text-xs text-gray-300 flex flex-col gap-1">
            <span>Note ID</span>
            <input
              type="text"
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 rounded bg-green-700 hover:bg-green-600" onClick={save}>Save</button>
            <button className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" onClick={cancel}>Cancel</button>
            <button className="px-3 py-2 rounded bg-red-700 hover:bg-red-600" onClick={() => { setEndLocal(''); }}>Clear end</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {block.noteId ? (
            <button className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600" onClick={() => onOpenNote && onOpenNote()}>Open Note</button>
          ) : (
            <button className="px-2 py-1 text-xs rounded bg-blue-700 hover:bg-blue-600" onClick={() => onAddNote && onAddNote()}>Add Note</button>
          )}
          <button className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-500" onClick={() => setIsEditing(true)}>Edit</button>
          {isActive && (
            <button className="px-2 py-1 text-xs rounded bg-yellow-600 hover:bg-yellow-500" onClick={() => onStop && onStop()}>Stop</button>
          )}
        </div>
      )}
    </div>
  );
}

