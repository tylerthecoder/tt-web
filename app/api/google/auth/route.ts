import { NextRequest, NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';
import { isPreviewHost } from '@/utils/auth';

export async function GET(req: NextRequest) {
    try {
        const tt = await getTT();

        const currentUrl = new URL(req.url);

        if (isPreviewHost(currentUrl.hostname)) {
            const redirectUrl = "https://www.tylertracy.com/api/google/callback";
            const returnUrl = `${currentUrl.protocol}//${currentUrl.hostname}/api/google/callback`;
            const statePayload = { returnOrigin: returnUrl };
            const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');
            const authUrl = tt.google.getAuthUrl(redirectUrl, state);
            console.log("Redirect URL", redirectUrl);
            console.log("Return URL", returnUrl);
            console.log("Auth URL", authUrl);
            return NextResponse.redirect(authUrl);
        }

        const redirectUrl = `${currentUrl.origin}/api/google/callback`;
        const authUrl = tt.google.getAuthUrl(redirectUrl);
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error initiating Google auth:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Google authentication' },
            { status: 500 }
        );
    }
}