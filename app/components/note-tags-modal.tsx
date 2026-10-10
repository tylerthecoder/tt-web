'use client';

import { useEffect, useMemo, useState } from 'react';

import { useTags } from '@/(panel)/hooks';

import { EditorDialog } from './note-editor/dialog';

type NoteTagsModalProps = {
  open: boolean;
  initialTags: string[];
  onClose: () => void;
  onSave: (tags: string[]) => Promise<void> | void;
};

export default function NoteTagsModal({
  open,
  initialTags,
  onClose,
  onSave,
}: NoteTagsModalProps) {
  const { tags: allTags, loading: tagsLoading } = useTags();
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTags(initialTags || []);
      setQuery('');
      setSaveError(null);
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
    setSaveError(null);
    try {
      await onSave(tags);
      onClose();
    } catch {
      setSaveError('Could not save tags. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorDialog
      open={open}
      onClose={onClose}
      label="Edit tags"
      busy={saving}
      className="w-[min(32rem,calc(100vw-2rem))] max-w-none max-h-[90dvh]"
    >
      <div className="bg-gray-900 rounded-lg w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-xl border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-white font-semibold">Edit tags</div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="text-gray-300 hover:text-white text-sm"
          >
            Close
          </button>
        </div>
        <fieldset disabled={saving} className="p-4 space-y-3">
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
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() => removeTag(t)}
                      className="hover:text-white"
                    >
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
                aria-label="Add tag"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) addTag(query);
                }}
                placeholder="Search or type a new tag…"
                className="min-w-0 flex-1 px-3 py-2 rounded-sm bg-black/40 border border-white/10 text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
              />
              <button
                type="button"
                onClick={() => addTag(query)}
                disabled={!query.trim()}
                className="px-3 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
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
                    type="button"
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
        </fieldset>
        {saveError && (
          <p role="alert" className="px-4 py-2 text-sm text-red-300">
            {saveError}
          </p>
        )}
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2 bg-black/30">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </EditorDialog>
  );
}
