const documentIdPattern = /^[A-Za-z0-9_-]{20,}$/;

/** Read an ID from a Docs link without navigating to or fetching the supplied URL. */
export function parseGoogleDocId(input: string): string | null {
  const value = input.trim();
  if (documentIdPattern.test(value)) return value;
  if (!/^https:\/\//i.test(value) || /[\s\\]/.test(value)) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'docs.google.com' ||
      url.port ||
      url.username ||
      url.password
    ) {
      return null;
    }
    // Account switching adds /u/<index>/; query parameters and fragments are
    // navigation details, not part of the document ID.
    return (
      url.pathname.match(/^\/document\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{20,})(?:\/[^\s]*)?$/)?.[1] ??
      null
    );
  } catch {
    return null;
  }
}
