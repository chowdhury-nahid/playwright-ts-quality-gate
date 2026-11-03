import { authedTest as test, expect } from '../src/fixtures';

// The seed for the Playwright test agents: a logged-in browser on a running app.
// The planner uses it as an example of how tests in this repo start.
test('seed', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('navigation')).toBeVisible();
});
