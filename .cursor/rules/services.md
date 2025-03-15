# Services Layer Guidelines

The project uses a services layer pattern for backend logic, primarily in the `tt-services` directory.

## Service Architecture

- Services are ES modules that export a class
- Services typically follow a singleton pattern with a static `make()` method
- Dependencies are injected through constructors
- Services use TypeScript interfaces to define their contracts

## Google Integration

- `GoogleService` handles authentication and API interactions with Google
- `GoogleNoteService` deals with integrating Google Docs into the notes system
- Both services use async/await for asynchronous operations

## Authentication

- Authentication state is managed through cookies
- Server-side authentication checks use the `cookies()` API from Next.js
- Client-side components receive authentication state as props, never checking directly

## Database Operations

- Database operations are centralized in service classes
- Use try/catch blocks for error handling in database operations
- Return structured responses with { success, data, error } pattern

## Service Creation

When creating or modifying services:
- Keep methods focused on a single responsibility
- Use dependency injection for testability
- Maintain consistent error handling across services
- Document public methods with JSDoc comments