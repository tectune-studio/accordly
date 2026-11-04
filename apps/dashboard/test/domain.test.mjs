import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { makeConfig, parseConfig, parseProject, validateReceipt } from '../lib/domain.mjs';
test('project validation rejects URLs, script input and malformed hosts', () => {
  assert.deepEqual(parseProject({ name: ' Website ', domain: 'EXAMPLE.COM' }), {
    name: 'Website',
    domain: 'example.com',
  });
  for (const domain of ['https://example.com', 'x.com/path', '<script>', 'bad-.com', '-bad.com'])
    assert.throws(() => parseProject({ name: 'X', domain }));
});
test('configuration identity cannot be overridden and privacy URL is safe', () => {
  const c = makeConfig('p');
  const parsed = parseConfig({ ...c, projectId: 'other', version: 'injected' }, 'p');
  assert.equal(parsed.projectId, 'p');
  assert.equal(parsed.version, 'draft');
  assert.throws(() => parseConfig({ ...c, privacyUrl: 'javascript:alert(1)' }, 'p'), /HTTP/);
  assert.throws(() => parseConfig({ ...c, brandColor: 'url(evil)' }, 'p'), /color/);
});
test('receipt validation ties decisions to exact releases and validates required purposes', () => {
  const config = { ...makeConfig('p'), version: 'release' };
  const receipt = {
    receiptId: crypto.randomUUID(),
    projectId: 'p',
    configurationVersion: 'release',
    clientTimestamp: new Date().toISOString(),
    action: 'reject',
    choices: { necessary: true, analytics: false, marketing: false },
    sdkVersion: '0.1.0',
  };
  assert.equal(validateReceipt(receipt, config).action, 'reject');
  assert.throws(() => validateReceipt({ ...receipt, projectId: 'other' }, config), /release/);
  assert.throws(
    () =>
      validateReceipt(
        { ...receipt, choices: { necessary: false, analytics: false, marketing: false } },
        config,
      ),
    /Required/,
  );
  assert.throws(() => validateReceipt({ ...receipt, action: 'accept' }, config), /enable/);
  assert.throws(
    () =>
      validateReceipt(
        { ...receipt, choices: { necessary: true, analytics: true, marketing: false } },
        config,
      ),
    /deny/,
  );
});
test('local store serializes concurrent writes and persists across reads', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'consentkit-store-'));
  process.env.CONSENTKIT_DATA_DIR = directory;
  const { mutateStore, readStore } = await import('../lib/store.mjs');
  try {
    await Promise.all(
      Array.from({ length: 20 }, () =>
        mutateStore((state) => {
          state.counter = (state.counter || 0) + 1;
        }),
      ),
    );
    assert.equal((await readStore()).counter, 20);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
