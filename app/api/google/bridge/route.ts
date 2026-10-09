import { NextResponse } from 'next/server';

import { privateAuthResponse } from '@/utils/oauth';

// Retired: reusable production session IDs must never be accepted from URLs.
export async function GET() {
  return privateAuthResponse(
    NextResponse.json(
      { error: 'Preview login is disabled. Sign in on the production site.' },
      { status: 410 },
    ),
  );
}
