# TylerTracy.com

NextJS application for personal notes, lists, and project management.

Deployed on personal server with Docker.

Requires tt-services.

## Development

Use Node 24 LTS (`.nvmrc`) and Bun 1.3.14. Install with `bun install --frozen-lockfile --ignore-scripts`, then run `bun dev`. Development binds to 127.0.0.1. Supply your own local service configuration for authenticated notes and chats; the test fixtures use in-memory data.

- `bun run lint` and `bun run format` use Biome.
- `bun run typecheck` checks app and fixture types.
- `bun run test` runs unit tests without making model calls.
- `bun run test:editor:browser` and `bun run test:frontend:browser` cover desktop Chromium and mobile WebKit. Install browsers first with `bunx playwright install chromium webkit`.
- `bun run build` produces the Next standalone server. Copy `public` and `.next/static` into its corresponding directories when packaging `.next/standalone`; image optimization uses Next's bundled Sharp dependency.
- `bun run analyze` uses Next's Turbopack analyzer.

The home page starts with the bouncing background. “Change background” selects another animation; reduced-motion settings stop continuous animation.

## Dependency updates

`bun.lock` is the committed text lockfile. The scheduled workflow updates the pinned `tt-services` revision and lockfile, validates the candidate, and opens a pull request. It does not push dependency changes directly to main.

`patches/tt-services.patch` narrows the Google Docs type import, aligns the legacy Agent schema import with Zod 3, and adds chat leases and atomic state/transcript commits. Bun applies the patch during installation. Keep it attached to each pinned revision until those changes are incorporated upstream; a patch conflict intentionally stops an automatic update.

For local service development, review and apply the compatibility patch to your sibling `tt-services` checkout, then run `bun run link-services` (or pass a checkout path). The script checks compatibility before changing the manifest. Do not commit local links.

The `/ai` chat uses AI SDK native approvals. Read tools run automatically; note edits require approval and pending decisions survive reloads. Interrupted turns expose a resume control. An uncertain note write is never retried automatically; check the note before requesting another change. Existing `/agent` runs remain supported by their original SDK.

## Environment Variables

### Authentication

The application uses Google OAuth for authentication with admin email restriction.

| Variable             | Required         | Default | Description                                                                                                                             |
| -------------------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAIL`        | Yes (production) | -       | The email address that is authorized to access the application. Only this email will be allowed to log in via Google OAuth.             |
| `FORCE_AUTH_LOCALLY` | No               | `false` | Set to `'true'` to enable authentication checks on localhost. By default, auth is disabled in development for easier local development. |

### Example Configuration

**Production (Docker/Server):**

```env
ADMIN_EMAIL=your-email@gmail.com
```

**Local Development:**

```env
# Auth is disabled by default on localhost
# No configuration needed for local development

# To test auth locally:
ADMIN_EMAIL=your-email@gmail.com
FORCE_AUTH_LOCALLY=true
```

### Authentication Behavior

- **Production**: Requires Google OAuth login with the specified `ADMIN_EMAIL`
- **Localhost (default)**: Authentication bypassed for easier development
- **Localhost (with `FORCE_AUTH_LOCALLY=true`)**: Full authentication required

Only the email specified in `ADMIN_EMAIL` will be allowed to access the application, even if other users successfully authenticate with Google OAuth.
