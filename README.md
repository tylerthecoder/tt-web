# TylerTracy.com

NextJS application for personal notes, lists, and project management.

Deployed on personal server with Docker.

Requires tt-services.

## Environment Variables

### Authentication

The application uses Google OAuth for authentication with admin email restriction.

| Variable        | Required         | Default | Description                                                                                                                 |
| --------------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAIL`   | Yes (production) | -       | The email address that is authorized to access the application. Only this email will be allowed to log in via Google OAuth. |
| `AUTH_DISABLED` | No               | `false` | Explicit local development bypass. Only honored with `NODE_ENV=development` outside Vercel. Never honored in production.    |

### Example Configuration

**Production (Docker/Server):**

```env
ADMIN_EMAIL=your-email@gmail.com
```

**Local Development:**

```env
# Authentication is enabled by default, including development.
ADMIN_EMAIL=your-email@gmail.com
# Optional local-only bypass (use only with a local test database):
# AUTH_DISABLED=true
```

### Authentication Behavior

- **Production**: Requires Google OAuth login with the specified `ADMIN_EMAIL`
- **Localhost (default)**: Full authentication required. Register the exact localhost callback URL with Google.
- **Local development with `AUTH_DISABLED=true`**: Explicitly bypasses authentication outside Vercel. Bind the server to loopback.
- **Preview deployments**: Login and the old cross-domain session bridge are disabled. Use the production site to sign in.

Only the email specified in `ADMIN_EMAIL` will be allowed to access the application, even if other users successfully authenticate with Google OAuth.

Production OAuth is restricted to `https://www.tylertracy.com` and `https://tylertracy.com`. The callback must receive the initiating browser's five-minute state cookie and a matching PKCE verifier. `GOOGLE_CREDS` must contain the Google web client's credentials and registered callback configuration; never commit its value.

The pinned `tt-services` dependency includes a Bun patch for OAuth isolation, administrator verification before storing tokens, and removal of credential logging. Use `bun install --frozen-lockfile`; other package managers do not apply this patch. Its `patchedDependencies` key uses Bun's resolved short Git revision. Do not update the dependency without regenerating the patch and passing `bun run test:auth`. The automatic dependency updater is paused until these fixes are upstream.

Run `bun run test:auth`, `bun run typecheck`, and `bun run lint` when changing authentication. See [the login audit](docs/login-security-audit.md) for findings and release follow-up.
