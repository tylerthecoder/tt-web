import { expect, test } from '@playwright/test';

test('Escape closes only the nested tags dialog and restores focus', async ({ page }) => {
  await page.goto('/?modal=1');
  const opener = page.getByRole('button', { name: 'Open editor' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const noteDialog = page.getByRole('dialog', { name: 'Note editor', exact: true });
  const editor = noteDialog.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' still editing');
  await noteDialog.getByText('Tags & sharing').click();
  const tagsButton = noteDialog.getByRole('button', { name: 'Edit tags', exact: true });
  await tagsButton.click();
  const tagsDialog = page.getByRole('dialog', { name: 'Edit tags', exact: true });
  await expect(tagsDialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(tagsDialog).toHaveCount(0);
  await expect(noteDialog).toBeVisible();
  await expect(editor).toContainText('still editing');
  await expect(tagsButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(noteDialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('still editing');
});

test('Escape during a nested tag save keeps both dialogs open', async ({ page }) => {
  await page.goto('/?modal=1');
  await page.getByRole('button', { name: 'Open editor' }).click();
  const noteDialog = page.getByRole('dialog', { name: 'Note editor', exact: true });
  await expect(noteDialog.getByRole('textbox', { name: 'Note content' })).toBeVisible();
  await noteDialog.getByText('Tags & sharing').click();
  const tagsButton = noteDialog.getByRole('button', { name: 'Edit tags', exact: true });
  await tagsButton.click();
  const tagsDialog = page.getByRole('dialog', { name: 'Edit tags', exact: true });
  await tagsDialog.getByRole('textbox', { name: 'Add tag' }).fill('saved-after-escape');
  await tagsDialog.getByRole('button', { name: 'Add', exact: true }).click();
  await page.evaluate(() => {
    (window as any).fixture.metadataDelay = 1200;
  });
  await tagsDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(tagsDialog.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(tagsDialog).toBeVisible();
  await expect(noteDialog).toBeVisible();
  await expect(tagsDialog).toHaveCount(0);
  await expect(noteDialog).toBeVisible();
  await expect(tagsButton).toBeFocused();
  expect(await page.evaluate(() => (window as any).fixture.notes.one.tags)).toContain(
    'saved-after-escape',
  );
});
