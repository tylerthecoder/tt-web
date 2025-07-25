import { MilkdownEditor } from "@/components/milkdown-note-editor";
import { MilkdownEditorWrapper } from "@/components/test-editor";

export default async function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        // <NoteEditor noteId={resolvedParams.id} />
        // <TTNoteEditor noteId={resolvedParams.id} />
        <MilkdownEditor noteId={resolvedParams.id} />
        // <MilkdownEditorWrapper />
    );
}