import { ListView } from '@/components/list-view';

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <ListView listId={id} showBackButton={true} backButtonUrl="/lists" />
    </div>
  );
}
