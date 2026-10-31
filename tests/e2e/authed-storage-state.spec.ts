import { authedTest as test, expect } from '../../src/fixtures';

test('the storageState override logs the page in as the worker user', async ({ page }) => {
  await page.goto('/#/');

  const stored = await page.evaluate(() => window.localStorage.getItem('loggedUser'));
  expect(stored).not.toBeNull();

  const parsed: { isAuth?: boolean } = JSON.parse(stored ?? '{}');
  expect(parsed.isAuth).toBe(true);
});
