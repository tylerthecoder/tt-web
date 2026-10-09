import { expect, test, type Page } from '@playwright/test';
import { localDraftContents } from './helpers';

async function openEditor(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Note content' })).toBeVisible();
}
async function append(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Note content' }).click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(text);
}
async function failSaves(page: Page) {
  await page.evaluate(() => {
    (window as any).fixture.fail = true;
  });
}

test('saving in another tab preserves the failed draft through reload and restore', async ({
  context,
  page,
}) => {
  await openEditor(page);
  const other = await context.newPage();
  await openEditor(other);
  await failSaves(page);
  await append(page, ' UNSAVED-A');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  await append(other, ' SAVED-B');
  await expect
    .poll(() => other.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('SAVED-B');
  await expect.poll(() => localDraftContents(page)).toEqual(['First note UNSAVED-A\n']);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Restore draft' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore draft' }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveText(
    'First note UNSAVED-A',
  );
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toBe('First note UNSAVED-A\n');
  await expect.poll(() => localDraftContents(page)).toEqual([]);
});

test('multiple drafts require a choice and restoring one preserves the other', async ({
  context,
  page,
}) => {
  await openEditor(page);
  const other = await context.newPage();
  await openEditor(other);
  await failSaves(page);
  await failSaves(other);
  await append(page, ' draft A');
  await append(other, ' draft B');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  await expect(other.getByRole('button', { name: 'Retry save' })).toBeVisible();
  const reopened = await context.newPage();
  await reopened.goto('/');
  const picker = reopened.getByLabel('Recovery version');
  await expect(picker.locator('option')).toHaveCount(2);
  await picker.selectOption('1');
  await reopened.getByText('Review recovered Markdown').click();
  await expect(reopened.locator('pre')).toHaveText('First note draft A\n');
  await failSaves(reopened);
  await reopened.getByRole('button', { name: 'Restore draft' }).click();
  await expect(reopened.getByRole('button', { name: 'Retry save' })).toBeVisible();
  // The original version survives a failed restoration, as well as the other tab's draft.
  expect(await localDraftContents(reopened)).toHaveLength(3);
  await reopened.evaluate(() => {
    (window as any).fixture.fail = false;
  });
  await reopened.getByRole('button', { name: 'Retry save' }).click();
  await expect.poll(() => localDraftContents(reopened)).toEqual(['First note draft B\n']);
});

test('discarding a reviewed version does not erase newer typing in its source tab', async ({
  context,
  page,
}) => {
  await openEditor(page);
  await failSaves(page);
  await append(page, ' original');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('button', { name: 'Keep server version' })).toBeVisible();
  await append(page, ' newer');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  await reopened.getByRole('button', { name: 'Keep server version' }).click();
  await expect(reopened.getByRole('textbox', { name: 'Note content' })).toHaveText('First note');
  expect(await localDraftContents(reopened)).toEqual(['First note original newer\n']);
});

test('legacy draft can be explicitly discarded without writing to the server', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tt-note-draft:one', 'Legacy draft'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Keep server version' }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveText('First note');
  expect(await localDraftContents(page)).toEqual([]);
  expect(await page.evaluate(() => (window as any).fixture.writes)).toEqual([]);
});

test('storage failure warns without preventing a successful server save', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  await openEditor(page);
  await page.evaluate(() => {
    (window as any).fixture.delay = 1000;
  });
  await append(page, ' storage unavailable');
  await expect(page.getByRole('alert')).toContainText('Local recovery is unavailable');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('storage unavailable');
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible();
});
