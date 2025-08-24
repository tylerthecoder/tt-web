'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

function GoogleAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error parameter in the URL
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      setError(
        errorParam === 'no_code'
          ? 'No authorization code received from Google'
          : errorParam === 'callback_failed'
            ? 'Failed to complete authentication with Google'
            : `Authentication error: ${errorParam}`,
      );
    }
  }, [searchParams]);

  const handleLogin = async () => {
    try {
      const returnUrl = encodeURIComponent(window.location.origin);
      window.location.href = `/api/google/auth?return=${returnUrl}`;
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      setError('Failed to start Google authentication. Please try again.');
    }
  };

  return (
    <div className="container max-w-lg py-10">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Connect with Google</h2>
          <p className="text-gray-600 mt-1">Sync your Google Docs with your notes system</p>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700">
              <div className="font-bold">Error</div>
              <div>{error}</div>
            </div>
          )}
          <p className="mb-4 text-gray-700">
            Connect your Google account to access and sync your Google Docs with your notes system.
            This integration requires access to your Google Drive and Google Docs.
          </p>
        </div>
        <div className="p-6 bg-gray-50 flex justify-between">
          <Link href="/">
            <button className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleLogin}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Connect with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoogleAuthPage() {
  return (
    <Suspense fallback={<div className="container max-w-lg py-10">Loading...</div>}>
      <GoogleAuthContent />
    </Suspense>
  );
}
