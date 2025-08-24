'use client';

import { Bubblegum_Sans } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const bubblegum = Bubblegum_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

function LoginContent() {
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'no_code':
          setError('No authorization code received from Google');
          break;
        case 'callback_failed':
          setError('Failed to complete authentication with Google');
          break;
        case 'admin_email_not_configured':
          setError('Server configuration error - admin email not set');
          break;
        case 'no_email':
          setError('Could not retrieve email from Google account');
          break;
        case 'unauthorized_email':
          setError('Access denied - only the admin email is authorized');
          break;
        default:
          setError(`Authentication error: ${errorParam}`);
      }
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      // Include the current origin as return target (API will encode into state)
      const returnUrl = encodeURIComponent(window.location.origin);
      window.location.href = `/api/google/auth?return=${returnUrl}`;
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
      setError('Failed to start Google authentication. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-lg bg-gray-400 bg-opacity-70">
        <h1 className={`text-4xl text-white text-center mb-8 ${bubblegum.className}`}>Sign In</h1>

        <div className="space-y-6">
          <p className="text-white text-center text-sm">
            Sign in with your authorized Google account to access your notes and lists.
          </p>

          {error && (
            <div className="bg-red-500 bg-opacity-80 border border-red-600 rounded-lg p-3">
              <p className="text-white text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 border-2 border-white rounded-lg shadow-md
                     text-white bg-blue-600 hover:bg-blue-700 font-semibold
                     transform transition duration-150 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
