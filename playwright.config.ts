import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './src/config';

const isCI = !!process.env.CI;
const useBlob = !!process.env.PW_BLOB;

const uiTests = ['e2e/**/*.spec.ts', 'hybrid/**/*.spec.ts'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // A test that passes only on retry is a defect in the test or the product: the run fails.
  // The retry still happens so the trace of the first failure is kept for diagnosis.
  failOnFlakyTests: isCI,
  retries: isCI ? 1 : 0,
  retryStrategy: 'isolated',
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['list'], useBlob ? ['blob'] : ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    // A failed test's trace keeps the DOM and the accessibility tree around each action (the aria part is plain text).
    // No screen snapshots: the tree already says what was on the page.
    trace: { mode: 'retain-on-first-failure', snapshots: { dom: true, aria: true, screen: false } },
  },
  projects: [
    { name: 'api', testMatch: 'api/**/*.spec.ts' },
    { name: 'e2e-chromium', testMatch: uiTests, use: { ...devices['Desktop Chrome'] } },
    { name: 'e2e-firefox', testMatch: uiTests, use: { ...devices['Desktop Firefox'] } },
    { name: 'e2e-webkit', testMatch: uiTests, use: { ...devices['Desktop Safari'] } },
  ],
});
