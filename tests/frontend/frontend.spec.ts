import { expect, test } from '@playwright/test';

test('homepage starts with a visible dark bouncing background', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const canvas = page.locator('[data-background="bouncing"]');
  await expect(canvas).toBeVisible();
  await expect(canvas.locator('..')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const initial = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
    .not.toBe(initial);
  await page.screenshot({ path: test.info().outputPath('home-background.png') });
  expect(errors).toEqual([]);
});

test('switching backgrounds preserves canvas dimensions on remount', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.goto('/');
  const change = page.getByRole('button', { name: 'Change background' });
  for (let round = 0; round < 2; round++) {
    await change.click();
    await change.click();
    await change.click();
    const canvas = page.locator('[data-background="game-of-life"]');
    await expect(canvas).toBeVisible();
    expect(await canvas.evaluate((el: HTMLCanvasElement) => [el.width, el.height])).toEqual(
      await page.evaluate(() => [innerWidth, innerHeight]),
    );
    await change.click();
  }
});

test('all backgrounds remain still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.goto('/');
  for (const name of ['bouncing', 'gravity', 'sierpinski', 'game-of-life']) {
    const canvas = page.locator(`[data-background="${name}"]`);
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(100);
    const initial = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    await page.waitForTimeout(150);
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(initial);
    await page.getByRole('button', { name: 'Change background' }).click();
  }
});

test('Tab and Enter activate the focused command', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'Commands' })).toBeVisible();
  if (isMobile) {
    // iOS does not tab through buttons by default; verify activation after focus.
    await page.getByRole('button', { name: 'Lists Manage your lists' }).focus();
  } else {
    for (let index = 0; index < 4; index++) await page.keyboard.press('Tab');
  }
  await expect(page.getByRole('button', { name: 'Lists Manage your lists' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => (window as any).testNavigation)).toBe('/lists');
});

test('command menu preserves translucent backdrop and exit animation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const backdrop = page.locator('.command-menu-backdrop');
  await expect(backdrop).toHaveCSS(
    'background-color',
    /(?:rgba\(0, 0, 0, 0\.5\)|oklab\(0 0 0 \/ 0\.5\))/,
  );
  await page.waitForTimeout(180);
  await page.keyboard.press('Escape');
  const animation = await backdrop.evaluate((el) => {
    const running = el.getAnimations()[0];
    running.pause();
    running.currentTime = 75;
    return Number(getComputedStyle(el).opacity);
  });
  expect(animation).toBeGreaterThan(0);
  expect(animation).toBeLessThan(1);
  await expect(backdrop).toHaveCount(0);
});
