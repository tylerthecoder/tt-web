'use client';

import { useEffect } from 'react';

import { logoutAction } from './actions';

export default function LogoutPage() {
  useEffect(() => {
    // Trigger logout immediately when the page loads
    logoutAction();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Logging out...</p>
      </div>
    </div>
  );
}
