'use client';

import { MilkdownEditor } from '@/components/milkdown-note-editor';

export default function NoteEdit({ noteId }: { noteId: string }) {
    return <MilkdownEditor noteId={noteId} />;
}


