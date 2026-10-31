import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './src/config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-first-failure',
  },
  projects: [
    { name: 'api', testMatch: 'api/**/*.spec.ts' },
    {
      name: 'e2e-chromium',
      testMatch: 'e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
