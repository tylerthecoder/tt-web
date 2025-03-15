# Next.js App Router Guidelines

When working with files in the `app` directory, follow these Next.js App Router conventions:

- Files named `page.tsx` define routes
- Files named `layout.tsx` create shared layouts
- Files named `loading.tsx` show loading states
- Files named `error.tsx` handle error states
- Files named `not-found.tsx` handle 404 errors
- Files in `app/api` are API routes using Next.js Route Handlers

## Server Components vs Client Components

- All components are React Server Components by default
- Client Components must use the 'use client' directive at the top of the file
- Files ending with `Client.tsx` should be client components
- Prefer Server Components when possible and only use Client Components when needed

## Data Fetching

- Use server components for data fetching when possible
- Use `cookies()` and `headers()` from 'next/headers' for server-side data
- For client components, use React hooks like `useEffect` for client-side data fetching

## Routing

- Use `Link` from 'next/link' for client-side navigation
- Use `usePathname()` from 'next/navigation' to access the current path in client components
- Use `redirect()` from 'next/navigation' for redirects in server components

## Patterns to Follow

- Keep responsive design logic in client components
- Leverage server components for authentication checks and initial data
- Pass minimal props from server to client components
