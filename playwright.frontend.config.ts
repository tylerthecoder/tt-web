import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: './test-results/frontend',
  testDir: './tests/frontend',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4320', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'bun tests/frontend/server.ts',
    url: 'http://127.0.0.1:4320',
    reuseExistingServer: !process.env.CI,
  },
});
