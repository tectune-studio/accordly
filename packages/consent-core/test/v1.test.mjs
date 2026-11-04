import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createConsentManager } from '../src/index.js';
import { ConsentEventSchema } from '../../schema/src/index.js';
const config = JSON.parse(
  await readFile(new URL('../../schema/examples/banner-config.json', import.meta.url)),
);
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
};
test('versioned events have UUIDv7 IDs, stable subjects and matching hashes', () => {
  const events = [],
    storage = memory(),
    m = createConsentManager({ config, storage, onEvent: (e) => events.push(e) }).initialize();
  assert.equal(m.getState(), 'unknown');
  m.acceptAll();
  m.withdraw();
  assert.equal(m.getState(), 'decided');
  for (const e of events) {
    assert.equal(ConsentEventSchema.safeParse(e).success, true);
    assert.equal(e.configHash, config.configHash);
  }
  assert.notEqual(events[0].eventId, events[1].eventId);
  assert.equal(events[0].subjectId, events[1].subjectId);
});
test('regional GPC overrides marketing even after accept all', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { globalPrivacyControl: true },
  });
  try {
    const events = [];
    const m = createConsentManager({
      config,
      storage: memory(),
      country: 'DE',
      onEvent: (e) => events.push(e),
    }).initialize();
    m.acceptAll();
    assert.equal(m.isAllowed('marketing'), false);
    assert.equal(m.isAllowed('analytics'), true);
    assert.equal(events[0].action, 'custom');
    assert.equal(events[0].gpcDetected, true);
  } finally {
    Object.defineProperty(globalThis, 'navigator', descriptor);
  }
});
test('Google default includes the synchronous update window before any update', () => {
  const calls = [];
  createConsentManager({
    config,
    storage: memory(),
    googleConsent: (...args) => calls.push(args),
  }).initialize();
  assert.equal(calls[0][1], 'default');
  assert.equal(calls[0][2].wait_for_update, 500);
  assert.equal(calls[1][1], 'update');
});
test('all shipped JS modules combined remain below 15 KiB gzipped', async () => {
  const root = new URL('../src/', import.meta.url);
  let total = 0;
  for (const file of await readdir(root))
    if (file.endsWith('.js')) total += gzipSync(await readFile(new URL(file, root))).length;
  assert.ok(total < 15 * 1024, `Core is ${total} gzip bytes`);
  console.log(`Core including lazy UI: ${total} gzip bytes`);
});
