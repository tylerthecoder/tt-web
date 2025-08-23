import { redirect } from 'next/navigation';

export default async function NoteViewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    redirect(`/panel/note/${resolvedParams.id}/view`);
}