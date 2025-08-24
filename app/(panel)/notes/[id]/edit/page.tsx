import { redirect } from 'next/navigation';

export default async function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    redirect(`/note/${resolvedParams.id}/edit`);
}