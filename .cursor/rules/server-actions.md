# Server Actions Guidelines

The project uses Next.js Server Actions for server-side operations.

## Structure

- Server actions are defined in files named `actions.ts` within feature directories
- Server actions are exported functions marked with 'use server' directive
- Each action should focus on a single responsibility
- Actions return structured responses with { success, data, error } pattern

## Authentication

- Server actions should check authentication status before performing sensitive operations
- Use `cookies()` from 'next/headers' to access authentication cookies
- Return appropriate error responses for unauthorized requests

## Error Handling

- Use try/catch blocks for comprehensive error handling
- Return structured error responses rather than throwing exceptions
- Log errors on the server side when appropriate

## Data Validation

- Validate all input parameters at the beginning of server actions
- Use zod or similar validation libraries when complex validation is needed
- Return clear validation error messages

## Service Integration

- Server actions should use the services layer for business logic
- Retrieve service instances through the dependency injection system
- Keep server actions thin - they should primarily coordinate between client and services

## Example Structure

```typescript
'use server'

import { cookies } from 'next/headers';
import { TylersThings } from 'tt-services';

export async function exampleAction(param1: string, param2: number) {
  // Check authentication
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.get('session')?.value === 'authenticated';

  if (!isLoggedIn) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate parameters
  if (!param1 || param2 < 0) {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    // Get services
    const services = await TylersThings.make();

    // Perform action using service layer
    const result = await services.someService.performOperation(param1, param2);

    // Return success response
    return { success: true, data: result };
  } catch (error) {
    console.error('Action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}