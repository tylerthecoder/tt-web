'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The actual OAuth callback is handled by the API route,
    // and it redirects to the docs page.
    // This page is just shown momentarily during processing.

    // After 2 seconds, redirect to the docs page if the API callback hasn't redirected yet
    const timeoutId = setTimeout(() => {
      router.push('/google/docs');
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="container max-w-lg py-10">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Completing Authentication</h2>
          <p className="text-gray-600 mt-1">
            Please wait while we finish connecting your Google account...
          </p>
        </div>
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
}
