'use client';

import { MilkdownEditor } from '@/components/milkdown-note-editor';

export default function NoteEditPage({ params }: { params: { id: string } }) {
  return <MilkdownEditor noteId={params.id} />;
}
