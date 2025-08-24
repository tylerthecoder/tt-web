'use client';

import { use } from 'react';

import { MilkdownEditor } from '@/components/milkdown-note-editor';

export default function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <MilkdownEditor noteId={resolvedParams.id} />;
}
