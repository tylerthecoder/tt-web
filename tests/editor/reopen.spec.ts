import { expect, test } from '@playwright/test';

for (const [saveDelay, readDelay] of [
  [200, 700],
  [700, 200],
]) {
  test(`immediate reopen reads after close-time save (${saveDelay}ms save, ${readDelay}ms read)`, async ({
    page,
  }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Note content' });
    await expect(editor).toBeVisible();
    await page.evaluate(
      ({ saveDelay, readDelay }) => {
        (window as any).fixture.delay = saveDelay;
        (window as any).fixture.readDelay = readDelay;
      },
      { saveDelay, readDelay },
    );
    await editor.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' saved before reopening');
    await page.getByRole('button', { name: 'Close editor' }).click();
    await page.getByRole('button', { name: 'Open editor' }).click();
    await expect(editor).toHaveText('First note saved before reopening');
    await expect
      .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
      .toBe('First note saved before reopening\n');
    // Further edits must extend the saved version, never overwrite it with an older fetch.
    await editor.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' and continued');
    await expect
      .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
      .toBe('First note saved before reopening and continued\n');
    await page.getByRole('button', { name: 'Close editor' }).click();
    await page.evaluate(() => {
      (window as any).fixture.notes.one.content = 'Changed elsewhere after saving\n';
    });
    await page.getByRole('button', { name: 'Open editor' }).click();
    await expect(editor).toHaveText('Changed elsewhere after saving');
  });
}

test('failed close-time save still reopens the latest local text', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await page.evaluate(() => {
    (window as any).fixture.delay = 200;
    (window as any).fixture.readDelay = 500;
    (window as any).fixture.fail = true;
  });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' unsaved but retained');
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.getByRole('button', { name: 'Open editor' }).click();
  await expect(editor).toHaveText('First note unsaved but retained');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  await page.evaluate(() => {
    (window as any).fixture.fail = false;
  });
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toBe('First note unsaved but retained\n');
});
