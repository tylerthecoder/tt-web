import { expect, test } from '@playwright/test';

test('an abandoned mount status response cannot replace a completed turn', async ({ page }) => {
  await page.goto('/chat?mode=stale-initial-status');
  await page.getByPlaceholder('Type a message...').fill('Keep completed turn');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Reply for one')).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.getByText('Keep completed turn', { exact: true })).toBeVisible();
  await expect(page.getByText('Reply for one')).toBeVisible();
});

test('narrow chat keeps the composer and long messages within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/chat');
  const send = page.getByRole('button', { name: 'Send', exact: true });
  const bounds = await send.boundingBox();
  if (!bounds) throw new Error('Send button is missing');
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  const content = `https://example.com/${'x'.repeat(400)}`;
  await page.getByPlaceholder('Type a message...').fill(content);
  await send.click();
  const message = page.getByText(content, { exact: true });
  await expect(message).toBeVisible();
  expect(await message.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
});

test('initial status failure blocks sending until a successful refresh', async ({ page }) => {
  await page.goto('/chat?status=unavailable');
  const input = page.getByPlaceholder('Type a message...');
  await expect(page.getByRole('alert')).toContainText('Status unavailable');
  await expect(input).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await page.evaluate(() => history.replaceState(null, '', '/chat'));
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(input).toBeEnabled();
  await input.fill('After status recovered');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Reply for one')).toBeVisible();
});

test('a successful recovery status releases the composer after a failed refresh', async ({
  page,
}) => {
  await page.goto('/chat?status=unavailable');
  const input = page.getByPlaceholder('Type a message...');
  await expect(page.getByRole('alert')).toContainText('Status unavailable');
  await expect(input).toBeDisabled();
  await page.evaluate(() => history.replaceState(null, '', '/chat?status=fail-once'));
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(input).toBeEnabled();
});

test('recovered pending approvals remain actionable after a failed refresh', async ({
  page,
}) => {
  await page.goto('/chat?status=unavailable');
  await expect(page.getByRole('alert')).toContainText('Status unavailable');
  await page.evaluate(() =>
    history.replaceState(null, '', '/chat?status=fail-once&approval=pending'),
  );
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(page.getByRole('button', { name: 'Approve', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Reject', exact: true })).toBeEnabled();
  await expect(page.getByPlaceholder('Type a message...')).toBeDisabled();
});

test('unaccepted send preserves its draft', async ({ page }) => {
  await page.goto('/chat?mode=reject');
  const input = page.getByPlaceholder('Type a message...');
  await input.fill('Draft to keep');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Request not accepted');
  await expect(input).toHaveValue('Draft to keep');
  await expect(input).toBeEnabled();
});

test('accepted failed turn reloads transcript and resumes without duplicate send', async ({
  page,
}) => {
  await page.goto('/chat?mode=accepted');
  const input = page.getByPlaceholder('Type a message...');
  await input.fill('Accepted message');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeDisabled();
  await expect(page.getByText('Accepted message', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Resume turn' }).click();
  await expect(page.getByText('Reply for one')).toBeVisible();
  await expect(input).toBeEnabled();
  await expect(page.getByText('Accepted message', { exact: true })).toHaveCount(1);
});

test('reload exposes an interrupted turn', async ({ page }) => {
  await page.goto('/chat?mode=reload');
  await page.getByRole('button', { name: 'Resume turn' }).click();
  await expect(page.getByText('Reply for one')).toBeVisible();
});

test('late send response cannot replace a different chat', async ({ page }) => {
  await page.goto('/chat?mode=slow');
  await page.getByPlaceholder('Type a message...').fill('Slow message');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'Switch chat' }).click();
  await page.waitForTimeout(700);
  await expect(page.getByText('Reply for one')).toHaveCount(0);
  await expect(page.getByText('Slow message')).toHaveCount(0);
  await page.getByPlaceholder('Type a message...').fill('Second message');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Reply for two')).toBeVisible();
});

test('accepted draft is reconciled after both send and status fail', async ({ page }) => {
  await page.goto('/chat?mode=double-failure');
  const input = page.getByPlaceholder('Type a message...');
  await input.fill('Accepted before disconnect');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Provider unavailable');
  await expect(input).toBeDisabled();
  await expect(input).toHaveValue('Accepted before disconnect');
  await page.getByRole('button', { name: 'Refresh status' }).click();
  await expect(page.getByText('Reply for one')).toBeVisible();
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue('');
  await expect(page.getByText('Accepted before disconnect', { exact: true })).toHaveCount(1);
});
