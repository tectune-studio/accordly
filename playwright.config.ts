import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ||
        (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run start -w @consentkit/dashboard -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 60000,
    env: { CONSENTKIT_MODE: 'demo', CONSENTKIT_DATA_DIR: process.cwd() + '/.data/e2e' },
  },
  outputDir: 'test-results',
});
