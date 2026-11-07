import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dataDirectory = path.join(tmpdir(), `accordly-e2e-${randomUUID()}`);
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  globalTeardown: './test/e2e-teardown.ts',
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
    command: 'npm run build && npm run start -w @accordly/dashboard -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 180000,
    env: { ACCORDLY_MODE: 'demo', CONSENTKIT_DATA_DIR: dataDirectory },
  },
  outputDir: 'test-results',
});
