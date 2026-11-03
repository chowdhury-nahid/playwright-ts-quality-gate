import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './src/config';

// Used only by the Playwright test agents, through the MCP server started by scripts/start-agents-mcp.sh.
// CHROMIUM_EXECUTABLE_PATH lets a machine whose installed browser build differs from the one Playwright expects
// point at another one. Leave it unset elsewhere.
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  testMatch: ['seed.spec.ts', 'agents/**/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: BASE_URL, trace: 'off' },
  projects: [
    {
      name: 'agents',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
});
