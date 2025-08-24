'use client';

import { ListView } from '@/components/list-view';

const LIFE_TODOS_LIST_ID = '68aa6450967040308b81b6ce';

export default function TodosPage() {
  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <h1 className="text-2xl font-bold">TO-DOs</h1>
      <ListView listId={LIFE_TODOS_LIST_ID} showBackButton={false} showTitle={false} />
    </div>
  );
}
