'use client';

import { useRouter } from 'next/navigation';

export function RefreshButton() {
    const router = useRouter();

    return (
        <button
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
            onClick={() => router.refresh()}
        >
            <span className="mr-2 inline-block">↻</span>
            Refresh
        </button>
    );
}