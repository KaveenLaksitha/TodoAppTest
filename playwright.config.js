import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3002',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/test-server.js',
    url: 'http://127.0.0.1:3002/api/todos',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
