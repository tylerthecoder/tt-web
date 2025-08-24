'use client';

import { useRouter } from 'next/navigation';

import CreateListForm from '@/components/create-list-form';

export default function CreateListPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New List</h1>
        <CreateListForm onSuccess={(list) => router.push(`/list/${list.id}`)} />
      </div>
    </div>
  );
}
