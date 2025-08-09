import { NextRequest, NextResponse } from 'next/server';
import { DatabaseSingleton, TylersThings } from 'tt-services';

export async function GET(req: NextRequest) {
    try {
        // Get the service through TylersThings
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        const authUrl = services.google.getAuthUrl(req.nextUrl.origin);

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