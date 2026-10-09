import { expect, test } from '@playwright/test';
import { localDraftContents } from './helpers';

test('typing saves normal spaces and blank lines without generated HTML', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' extra ');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Another paragraph');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('Another paragraph');
  const saved = await page.evaluate(() => (window as any).fixture.notes.one.content);
  expect(saved).not.toMatch(/<br\s*\/?\s*>|&#x20;/);
  expect(saved).toContain('\n\n\nAnother paragraph');
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.getByRole('button', { name: 'Open editor' }).click();
  await expect(editor).toContainText('Another paragraph');
  expect(errors).toEqual([]);
});

test('switching notes immediately saves final typing to the correct note', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' final characters');
  await page.getByRole('button', { name: 'Switch note' }).click();
  await expect(editor).toHaveText('Second note');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('final characters');
  expect(await page.evaluate(() => (window as any).fixture.notes.two.content)).toBe(
    'Second note\n',
  );
});

test('failed saves display retry and keep a local recovery copy', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await page.evaluate(() => {
    (window as any).fixture.fail = true;
  });
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' offline draft');
  await expect(page.getByRole('button', { name: 'Retry save' })).toBeVisible();
  expect((await localDraftContents(page)).join('\n')).toContain('offline draft');
  await page.evaluate(() => {
    (window as any).fixture.fail = false;
  });
  await page.getByRole('button', { name: 'Retry save' }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible();
  expect(await localDraftContents(page)).toEqual([]);
});

test('accessible toolbar formats and undoes without losing selection', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page
    .getByRole('group', { name: 'Formatting' })
    .getByRole('button', { name: 'Bold', exact: true })
    .click();
  await expect(editor.locator('strong')).toHaveText('First note');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(editor.locator('strong')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('rename and tags preserve body edits without reloading', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' keep me');
  await page.getByRole('button', { name: 'Edit title' }).click();
  await page.getByRole('textbox', { name: 'Note title' }).fill('Renamed');
  await page.getByRole('button', { name: 'Save title' }).click();
  await expect(page.getByRole('heading', { name: 'Renamed' })).toBeVisible();
  await expect(editor).toContainText('keep me');
  await page.getByText('Tags & sharing').click();
  await page.getByRole('button', { name: 'Edit tags' }).click();
  await page.getByRole('textbox', { name: 'Add tag' }).fill('new-tag');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(editor).toContainText('keep me');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.tags))
    .toContain('new-tag');
});

test('reopen fetches remote changes instead of reusing stale cached content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Note content' })).toBeVisible();
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.evaluate(() => {
    (window as any).fixture.notes.one.content = 'Changed elsewhere\n';
  });
  await page.getByRole('button', { name: 'Open editor' }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveText('Changed elsewhere');
});

test('restores a local draft after reopening the app', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tt-note-draft:one', 'Recovered draft\n'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Restore draft' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore draft' }).click();
  await expect(page.getByRole('textbox', { name: 'Note content' })).toHaveText('Recovered draft');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toBe('Recovered draft\n');
});

test('preserves original top-level spacing through repeated editing', async ({ page }) => {
  const original = '\n\nFirst\n\n\nSecond\n\n\n';
  await page.goto('/?content=' + encodeURIComponent(original));
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  expect(await page.evaluate(() => (window as any).fixture.writes)).toEqual([]);
  await editor
    .locator('p')
    .filter({ hasText: /^First$/ })
    .click();
  await page.keyboard.press('End');
  await page.keyboard.type(' edit');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toBe(original.replace('First', 'First edit'));
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.getByRole('button', { name: 'Open editor' }).click();
  await expect(editor).toBeVisible();
  await editor
    .locator('p')
    .filter({ hasText: /^First edit$/ })
    .click();
  await page.keyboard.press('End');
  await page.keyboard.type(' twice');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toBe(original.replace('First', 'First edit twice'));
});

test('keyboard activation works in formatting controls', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  const bold = page
    .getByRole('group', { name: 'Formatting' })
    .getByRole('button', { name: 'Bold', exact: true });
  await bold.focus();
  await page.keyboard.press('Enter');
  await expect(editor.locator('strong')).toHaveText('First note');
});

test('Google pull flushes first and locks editing until it settles', async ({ page }) => {
  await page.goto('/?google=1');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.type(' before pull');
  await page.getByText('Tags & sharing').click();
  await page.getByRole('button', { name: 'Pull from Google' }).click();
  await expect(editor).toHaveAttribute('contenteditable', 'false');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('before pull');
  await page.evaluate(() => (window as any).finishPull());
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await expect(editor).toContainText('before pull');
});

test('checklist and heading controls work without hover', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.click();
  await page.getByRole('button', { name: 'Checklist', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toMatch(/[-*] \[ \] First note/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByLabel('Paragraph style').selectOption('2');
  await expect(editor.locator('h2')).toHaveText('First note');
});

test('tag dialog contains focus and Escape returns to the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Note content' })).toBeVisible();
  await page.getByText('Tags & sharing').click();
  await page.getByRole('button', { name: 'Edit tags' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit tags' })).toBeFocused();
});

test('authored HTML and code examples survive unrelated editing', async ({ page }) => {
  const source = 'First\n\n<br />\n\n```html\n<br /> &#x20;\n```\n\nLast\n';
  await page.goto('/?content=' + encodeURIComponent(source));
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor
    .locator('p')
    .filter({ hasText: /^Last$/ })
    .click();
  await page.keyboard.press('End');
  await page.keyboard.type(' changed');
  await expect
    .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
    .toContain('Last changed');
  const saved = await page.evaluate(() => (window as any).fixture.notes.one.content);
  expect(saved).toContain('<br />');
  expect(saved).toContain('```html\n<br /> &#x20;\n```');
});

test('short mobile view keeps the end of a long note reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await page.goto(
    '/?content=' +
      encodeURIComponent(Array.from({ length: 50 }, (_, i) => `Paragraph ${i}`).join('\n\n')),
  );
  const editor = page.getByRole('textbox', { name: 'Note content' });
  await expect(editor).toBeVisible();
  await editor.locator('p').filter({ hasText: 'Paragraph 49' }).scrollIntoViewIfNeeded();
  await expect(editor.locator('p').filter({ hasText: 'Paragraph 49' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('mobile-editor.png') });
});

for (const daily of [false, true]) {
  test(`autosave status keeps editor height stable (${daily ? 'daily' : 'titled'} note)`, async ({
    page,
  }) => {
    await page.goto(daily ? '/?daily=1' : '/');
    const editor = page.getByRole('textbox', { name: 'Note content' });
    await expect(editor).toBeVisible();
    const toolbar = page.getByRole('group', { name: 'Formatting' });
    const saved = toolbar.getByRole('status').filter({ hasText: /^Saved$/ });
    if (daily) {
      const navigation = await page.getByRole('button', { name: 'Close editor' }).boundingBox();
      expect((await toolbar.boundingBox())?.y).toBe(navigation!.y + navigation!.height);
    }
    await expect(saved).toHaveClass(/text-green-400/);
    await page.evaluate(() => {
      (window as any).fixture.delay = 1200;
    });
    const before = await editor.boundingBox();
    await editor.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(' more text');
    await expect(page.getByRole('status').filter({ hasText: 'Saving…' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save now' })).toHaveCount(0);
    expect(await editor.boundingBox()).toEqual(before);
    await expect.poll(() => localDraftContents(page), { timeout: 5000 }).toEqual([]);
    await expect(saved).toBeVisible();
    expect(await editor.boundingBox()).toEqual(before);
  });
}
