# Google Authentication Migration

This document outlines the migration from password-based authentication to Google OAuth authentication.

## What Changed

### ✅ Completed Changes

1. **Replaced Password Login with Google OAuth**
   - Removed password input form from `/login`
   - Added Google OAuth login button with Google branding
   - Integrated with existing `tt-services` Google OAuth implementation

2. **Updated Authentication Flow**
   - `/api/google/auth` - Initiates Google OAuth flow
   - `/api/google/callback` - Handles OAuth callback and sets session cookies
   - Session cookie (`session=authenticated`) is now set after successful Google authentication

3. **Enhanced Middleware Protection**
   - All pages now protected except: `/`, `/login`, `/projects`, `/blog`, and API routes
   - Redirects unauthenticated users to `/login`
   - Supports both static files and dynamic routes

4. **Added Logout Functionality**
   - Logout button appears in navbar when authenticated
   - Clears both `session` and `googleUserId` cookies
   - Redirects to login page after logout

5. **Removed Password Dependencies**
   - Removed `bcrypt` and `@types/bcrypt` packages
   - Removed `ADMIN_PASSWORD` environment variable requirement
   - Cleaned up password-related code

## Required Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tylertracy-website

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Google API Configuration (for Google Docs)
GOOGLE_CREDENTIALS_PATH=./google-keys.json

NODE_ENV=development
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API and Google Docs API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google/callback` (for development)
5. Download the credentials and add them to your `.env` file

### Google Service Account (for Google Docs integration)

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Save it as `google-keys.json` in your project root
4. Share your Google Docs with the service account email

## Authentication Flow

1. **Unauthenticated User**: 
   - Accesses protected route → Redirected to `/login`
   - Clicks "Sign in with Google" → Redirected to Google OAuth

2. **Google OAuth Process**:
   - User authorizes app → Google redirects to `/api/google/callback`
   - Callback exchanges code for tokens → Sets session cookies
   - User redirected to `/panel`

3. **Authenticated User**:
   - Session cookie allows access to protected routes
   - Google userId cookie enables Google Docs integration
   - Logout button available in navbar

## Protected Routes

- **Public Routes**: `/`, `/login`, `/projects`, `/blog`
- **Protected Routes**: `/panel`, `/notes`, `/lists`, and all other routes
- **API Routes**: Google auth endpoints are public, others follow same rules

## Migration Notes

- **Backward Compatibility**: No existing user data affected
- **Session Duration**: Extended to 30 days (from 7 days)
- **Error Handling**: Enhanced error messages for OAuth failures
- **Mobile Support**: Login and logout work on mobile menu

## Testing

1. Start the development server: `npm run dev`
2. Navigate to any protected route (e.g., `/panel`)
3. Should redirect to `/login`
4. Click "Sign in with Google"
5. Complete OAuth flow
6. Should be redirected to `/panel` with authenticated session
7. Logout button should appear in navbar
8. Click logout to clear session and return to login