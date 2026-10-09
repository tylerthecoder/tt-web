import type { Page } from '@playwright/test';

export async function localDraftContents(page: Page, noteId = 'one'): Promise<string[]> {
  return page.evaluate((id) => {
    const contents: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)!;
      const raw = localStorage.getItem(key)!;
      if (key === `tt-note-draft:${id}`) contents.push(raw);
      else if (key.startsWith(`tt-note-draft:v2:${encodeURIComponent(id)}:`))
        contents.push(JSON.parse(raw).content);
    }
    return contents;
  }, noteId);
}
