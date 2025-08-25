'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useTags } from '@/(panel)/hooks';

type NoteTagsModalProps = {
  open: boolean;
  initialTags: string[];
  onClose: () => void;
  onSave: (tags: string[]) => Promise<void> | void;
};

export default function NoteTagsModal({ open, initialTags, onClose, onSave }: NoteTagsModalProps) {
  const { tags: allTags, loading: tagsLoading, error } = useTags();
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTags(initialTags || []);
      setQuery('');
    }
  }, [open, initialTags]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allTags.filter((t) => !tags.includes(t));
    if (!q) return base.slice(0, 20);
    return base.filter((t) => t.toLowerCase().includes(q)).slice(0, 20);
  }, [allTags, tags, query]);

  if (!open) return null;

  const addTag = (t: string) => {
    const tag = t.trim();
    if (!tag) return;
    if (tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setQuery('');
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(tags);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 rounded-lg w-full max-w-lg shadow-xl border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-semibold">Edit tags</div>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-sm">
            Close
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Current tags</div>
            <div className="flex flex-wrap gap-1">
              {tags.length === 0 ? (
                <div className="text-xs text-gray-500">No tags</div>
              ) : (
                tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button onClick={() => removeTag(t)} className="hover:text-white">
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Add tag</div>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) addTag(query);
                }}
                placeholder="Search or type a new tag…"
                className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
              <button
                onClick={() => addTag(query)}
                disabled={!query.trim()}
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Suggestions</div>
            <div className="flex flex-wrap gap-1">
              {tagsLoading ? (
                <div className="text-xs text-gray-400">Loading…</div>
              ) : suggestions.length === 0 ? (
                <div className="text-xs text-gray-500">No suggestions</div>
              ) : (
                suggestions.map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded-full"
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2 bg-black/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
