// Shared with Edge middleware; keep this module free of Node-only imports.
export function isAuthDisabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.AUTH_DISABLED === 'true' &&
    !process.env.VERCEL
  );
}

export function isAdminEmail(email: unknown): email is string {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  return Boolean(adminEmail) && typeof email === 'string' && email === adminEmail;
}
