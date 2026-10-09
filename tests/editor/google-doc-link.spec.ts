import { expect, test } from '@playwright/test';

test('existing Google Doc selector accepts account-indexed links and rejects invalid input', async ({
  page,
}) => {
  await page.goto('/?google=1');
  await expect(page.getByRole('textbox', { name: 'Note content' })).toBeVisible();
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.evaluate(() => {
    const note = (window as any).fixture.notes.one;
    note.tags = [];
    delete note.googleDocId;
  });
  await page.getByRole('button', { name: 'Open editor' }).click();
  await page.getByText('Tags & sharing').click();
  await page.getByRole('button', { name: 'Sync with Google', exact: true }).click();
  await page.getByRole('button', { name: /Sync with Existing Doc/ }).click();
  const input = page.getByLabel('Google Doc link or ID');
  const connect = page.getByRole('button', { name: 'Connect document' });
  const id = '1Example_google-DocumentId123456789';
  for (const value of [
    id,
    `https://docs.google.com/document/d/${id}/edit?usp=sharing`,
    `https://docs.google.com/document/u/0/d/${id}/edit?tab=t.0#heading=h.example`,
  ]) {
    await input.fill(value);
    await expect(connect).toBeEnabled();
  }
  for (const value of [
    'short-id',
    `https://example.com/document/d/${id}/edit`,
    `https://docs.google.com/document/u/0/d/${id}.bad/edit`,
  ]) {
    await input.fill(value);
    await expect(connect).toBeDisabled();
  }
});
