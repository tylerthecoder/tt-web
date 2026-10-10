import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  outputDir: './test-results/editor',
  testDir: './tests/editor',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4319', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'bun tests/editor/server.ts',
    url: 'http://127.0.0.1:4319',
    reuseExistingServer: !process.env.CI,
  },
});
