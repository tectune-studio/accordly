import type { FullConfig } from '@playwright/test';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export default async function teardown(config: FullConfig) {
  const directory = config.webServer?.env?.CONSENTKIT_DATA_DIR;
  if (
    directory &&
    path.dirname(directory) === tmpdir() &&
    /^accordly-e2e-[0-9a-f-]+$/.test(path.basename(directory))
  ) {
    await rm(directory, { recursive: true, force: true });
  }
}
