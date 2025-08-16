import { NextRequest, NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';

export async function GET(req: NextRequest) {
    try {
        const tt = await getTT();
        const authUrl = tt.google.getAuthUrl();

        // Redirect the user to Google's OAuth consent screen
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error initiating Google auth:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Google authentication' },
            { status: 500 }
        );
    }
}