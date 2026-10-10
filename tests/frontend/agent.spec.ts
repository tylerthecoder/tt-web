import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    (window as any).agentScrolls = [];
    Element.prototype.scrollIntoView = function () {
      (window as any).agentScrolls.push(this.parentElement?.textContent ?? '');
      original.call(this, { behavior: 'instant' });
    };
  });
});

test('a taller replacement approval scrolls after rendering with unchanged counts', async ({
  page,
}) => {
  await page.goto('/agent?mode=replacement-approval');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  const preview = page.getByText(/Replacement approval complete/);
  await expect(preview).toBeVisible();
  await expect(page.getByText('user', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).agentScrolls.some((text: string) =>
          text.includes('Replacement approval complete'),
        ),
      ),
    )
    .toBe(true);
  const remaining = await preview.evaluate((element) => {
    const scroller = element.closest('.overflow-y-auto');
    if (!scroller) throw new Error('Missing transcript scroll container');
    return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
  });
  expect(remaining).toBeLessThanOrEqual(1);
});

test('switching equal-count chats scrolls after the longer transcript renders', async ({
  page,
}) => {
  await page.goto('/agent');
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeVisible();
  await expect(page.getByText('user', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: /Longer chat/ }).click();
  const message = page.getByText(/Longer existing message\n[\s\S]*Second chat complete/);
  await expect(message).toBeVisible();
  await expect(page.getByText('user', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).agentScrolls.some((text: string) =>
          text.includes('Second chat complete'),
        ),
      ),
    )
    .toBe(true);
  const remaining = await message.evaluate((element) => {
    const scroller = element.parentElement?.parentElement;
    if (!scroller) throw new Error('Missing transcript scroll container');
    return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
  });
  expect(remaining).toBeLessThanOrEqual(1);
});

for (const decision of ['Approve', 'Reject']) {
  test(`${decision} scrolls after the approval is replaced by a long reply`, async ({
    page,
  }) => {
    await page.goto('/agent');
    await page.getByRole('button', { name: decision, exact: true }).click();
    const reply = page.getByText(/Long reply\n[\s\S]*Reply complete/);
    await expect(reply).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).agentScrolls.some((text: string) => text.includes('Reply complete')),
        ),
      )
      .toBe(true);
    const remaining = await reply.evaluate((element) => {
      const scroller = element.parentElement?.parentElement;
      if (!scroller) throw new Error('Missing transcript scroll container');
      return scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    });
    expect(remaining).toBeLessThanOrEqual(1);
  });
}
