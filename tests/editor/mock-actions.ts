// In-memory server-action replacement for the browser fixture. Never connects to MongoDB.
const initial = new URLSearchParams(location.search).get('content') ?? 'First note\n';
export const fixture = {
  notes: {
    one: {
      id: 'one',
      title: 'First note',
      content: initial,
      tags: ['daily'],
      published: false,
    },
    two: {
      id: 'two',
      title: 'Second note',
      content: 'Second note\n',
      tags: [],
      published: false,
    },
  } as Record<string, any>,
  writes: [] as { id: string; content: string }[],
  fail: false,
  delay: 0,
  metadataDelay: 0,
  readDelay: 0,
};
Object.assign(window, { fixture });
export async function getNote(id: string) {
  // Snapshot before delay to model a response that becomes stale while a save finishes.
  const note = { ...fixture.notes[id] };
  if (fixture.readDelay) await new Promise((resolve) => setTimeout(resolve, fixture.readDelay));
  return note;
}
export async function updateNoteContent(id: string, content: string) {
  if (fixture.delay) await new Promise((resolve) => setTimeout(resolve, fixture.delay));
  if (fixture.fail) throw new Error('Offline');
  fixture.writes.push({ id, content });
  fixture.notes[id].content = content;
}
export async function updateNoteMetadata(id: string, updates: any) {
  if (fixture.metadataDelay)
    await new Promise((resolve) => setTimeout(resolve, fixture.metadataDelay));
  if (fixture.fail) throw new Error('Offline');
  Object.assign(fixture.notes[id], updates);
}
export async function getAllTags() {
  return { success: true, tags: ['daily', 'work'] };
}
export async function publishNote(id: string) {
  fixture.notes[id].published = true;
}
export async function unpublishNote(id: string) {
  fixture.notes[id].published = false;
}

if (new URLSearchParams(location.search).has('google')) {
  fixture.notes.one.tags = ['google-doc'];
  fixture.notes.one.googleDocId = 'test-google-document-id';
}
export async function pullContentFromGoogleDoc() {
  await new Promise<void>((resolve) => Object.assign(window, { finishPull: resolve }));
  throw new Error('Test pull failed');
}
