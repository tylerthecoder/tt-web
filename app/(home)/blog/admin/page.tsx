import { revalidateTag } from 'next/cache';

import { requireAuth } from '@/utils/auth';

export default async function Page() {
  await requireAuth();

  async function revalidate() {
    'use server';
    console.log('Revalidating blogs');
    revalidateTag('blog');
  }

  return (
    <div>
      <form action={revalidate}>
        <button type="submit"> Revalidate Blogs </button>;
      </form>
    </div>
  );
}
