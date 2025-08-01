import { MilkdownEditor } from "@/components/milkdown-note-editor";

export default async function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <MilkdownEditor noteId={resolvedParams.id} />
    );
}