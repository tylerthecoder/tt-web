import { expect, test } from '@playwright/test';

for (const [name, block] of [
  ['math', '$$\nx^2\n$$'],
  ['image', '![1.00](https://example.com/image.png)'],
]) {
  test(`preserves leading, surrounding, and trailing blank lines with ${name} blocks`, async ({
    page,
  }) => {
    const source = `\n\n${block}\n\n\nLast\n\n\n${block}\n\n\n`;
    await page.goto('/?content=' + encodeURIComponent(source));
    const editor = page.getByRole('textbox', { name: 'Note content' });
    await expect(editor).toBeVisible();

    for (const suffix of [' edited', ' twice']) {
      const previous = suffix === ' edited' ? 'Last' : 'Last edited';
      await editor
        .locator('p')
        .filter({ hasText: new RegExp(`^${previous}$`) })
        .click();
      await page.keyboard.press('End');
      await page.keyboard.type(suffix);
      const expected = source.replace('Last', previous + suffix);
      await expect
        .poll(() => page.evaluate(() => (window as any).fixture.notes.one.content))
        .toBe(expected);
      await page.getByRole('button', { name: 'Close editor' }).click();
      await page.getByRole('button', { name: 'Open editor' }).click();
      await expect(editor).toBeVisible();
    }
  });
}
