import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  discardDraft,
  NoteDraftStore,
  readDrafts,
} from '../../app/components/note-editor/recovery';

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
beforeEach(() => {
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return entries.size;
      },
      key: (index: number) => [...entries.keys()][index] ?? null,
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: (key: string) => {
        entries.delete(key);
      },
    },
  });
});
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('local recovery ownership', () => {
  test('a successful writer removes only its own copy', () => {
    const a = new NoteDraftStore('one');
    const b = new NoteDraftStore('one');
    a.persist('unsaved A');
    b.persist('saved B');
    b.persist(null);
    expect(readDrafts('one').map((draft) => draft.content)).toEqual(['unsaved A']);
  });
  test('keeps only the newest immutable revision of a writer', () => {
    const store = new NoteDraftStore('one');
    store.persist('old');
    const old = readDrafts('one')[0];
    store.persist('new');
    expect(discardDraft(old)).toBe(true);
    expect(readDrafts('one').map((draft) => draft.content)).toEqual(['new']);
  });
  test('restoration retains the source until save confirmation and leaves other versions', () => {
    const a = new NoteDraftStore('one');
    const b = new NoteDraftStore('one');
    const restored = new NoteDraftStore('one');
    a.persist('A');
    b.persist('B');
    const source = readDrafts('one').find((draft) => draft.content === 'A')!;
    restored.adopt(source);
    restored.persist('A edited');
    expect(readDrafts('one')).toHaveLength(3);
    restored.persist(null);
    expect(readDrafts('one').map((draft) => draft.content)).toEqual(['B']);
  });
  test('restoration cleanup cannot delete newer typing in the source tab', () => {
    const source = new NoteDraftStore('one');
    const restored = new NoteDraftStore('one');
    source.persist('old');
    restored.adopt(readDrafts('one')[0]);
    restored.persist('old');
    source.persist('new typing');
    restored.persist(null);
    expect(readDrafts('one').map((draft) => draft.content)).toEqual(['new typing']);
  });
  test('reads legacy drafts and refuses to discard a changed legacy value', () => {
    localStorage.setItem('tt-note-draft:one', 'legacy');
    const draft = readDrafts('one')[0];
    expect(draft.content).toBe('legacy');
    localStorage.setItem('tt-note-draft:one', 'changed');
    expect(discardDraft(draft)).toBe(false);
    expect(readDrafts('one')[0].content).toBe('changed');
  });
  test('ignores malformed and unrelated entries and preserves an empty draft', () => {
    localStorage.setItem('tt-note-draft:v2:one:broken', '{');
    localStorage.setItem('tt-note-draft:v2:one:invalid', '{"content":4,"updatedAt":0}');
    new NoteDraftStore('one:two').persist('unrelated');
    new NoteDraftStore('one').persist('');
    expect(readDrafts('one').map((draft) => draft.content)).toEqual(['']);
  });
  test('failed replacement keeps the prior recovery copy', () => {
    const store = new NoteDraftStore('one');
    store.persist('saved locally');
    localStorage.setItem = () => {
      throw new Error('Quota exceeded');
    };
    expect(() => store.persist('new content')).toThrow();
    expect(readDrafts('one')[0].content).toBe('saved locally');
  });
});
