/** Device-local, plaintext recovery copies; never the authoritative note store. */
export interface RecoveryDraft {
  key: string;
  raw: string;
  content: string;
  updatedAt: number | null;
}

const legacyKey = (noteId: string) => `tt-note-draft:${noteId}`;
const draftPrefix = (noteId: string) => `tt-note-draft:v2:${encodeURIComponent(noteId)}:`;

export function readDrafts(noteId: string): RecoveryDraft[] {
  const drafts: RecoveryDraft[] = [];
  try {
    const legacy = localStorage.getItem(legacyKey(noteId));
    if (legacy !== null)
      drafts.push({ key: legacyKey(noteId), raw: legacy, content: legacy, updatedAt: null });
    const prefix = draftPrefix(noteId);
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        const value = JSON.parse(raw);
        if (typeof value?.content !== 'string' || !Number.isFinite(value.updatedAt)) continue;
        drafts.push({ key, raw, content: value.content, updatedAt: value.updatedAt });
      } catch {
        // A malformed entry must not hide the other recoverable versions.
      }
    }
  } catch {
    // Saving still works when browser storage is disabled.
  }
  return drafts.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}

/** Only discard the version actually reviewed, never a newer edit in its source tab. */
export function discardDraft(draft: RecoveryDraft): boolean {
  const current = localStorage.getItem(draft.key);
  if (current === null) return true;
  if (current !== draft.raw) return false;
  localStorage.removeItem(draft.key);
  return true;
}

export class NoteDraftStore {
  private readonly prefix: string;
  private key: string | undefined;
  private revision = 0;
  private restored: RecoveryDraft[] = [];

  constructor(noteId: string) {
    // Per writer, not sessionStorage: duplicating a tab can clone sessionStorage IDs.
    this.prefix = `${draftPrefix(noteId)}${crypto.randomUUID()}:`;
  }

  adopt(draft: RecoveryDraft) {
    this.restored.push(draft);
  }

  persist = (content: string | null) => {
    if (content !== null) {
      // Immutable revisions avoid a read/remove race with another tab reviewing a draft.
      // Keep only this writer's newest revision, writing it before removing its predecessor.
      const key = `${this.prefix}${++this.revision}`;
      localStorage.setItem(key, JSON.stringify({ content, updatedAt: Date.now() }));
      const previous = this.key;
      this.key = key;
      if (previous) localStorage.removeItem(previous);
      return;
    }
    // Called only after the ordered writer confirms all queued edits reached the server.
    if (this.key) localStorage.removeItem(this.key);
    this.key = undefined;
    for (const draft of this.restored) discardDraft(draft);
    this.restored = [];
  };
}
