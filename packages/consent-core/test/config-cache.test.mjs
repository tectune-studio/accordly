import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadHostedConfig, createConsentManager } from '../src/index.js';
import { adaptConfig } from '../src/v1.js';
const config = JSON.parse(
  await readFile(new URL('../../schema/examples/banner-config.json', import.meta.url)),
);
const url = 'https://cdn.example/cfg/p.json';
function storage() {
  const data = new Map();
  return { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
}
test('fresh configuration and valid cookie skip network; expired cache falls back offline', async () => {
  const store = storage();
  const manager = createConsentManager({ config, storage: store }).initialize();
  manager.rejectAll();
  const now = Date.now();
  const cookie =
    encodeURIComponent(`accordly:${config.projectId}`) +
    '=' +
    encodeURIComponent(JSON.stringify(manager.getReceipt()));
  store.setItem(`accordly:config:${url}`, JSON.stringify({ savedAt: now, config }));
  let calls = 0;
  const fetcher = async () => {
    calls++;
    throw Error('offline');
  };
  assert.deepEqual(await loadHostedConfig(url, { storage: store, cookie, now, fetcher }), config);
  assert.equal(calls, 0);
  assert.deepEqual(
    await loadHostedConfig(url, { storage: store, cookie, now: now + 3600001, fetcher }),
    config,
  );
  assert.equal(calls, 1);
});
test('corrupt storage cannot substitute configuration and unknown country uses opt-in', async () => {
  const store = storage();
  store.setItem(`accordly:config:${url}`, 'broken');
  await assert.rejects(
    loadHostedConfig(url, {
      storage: store,
      fetcher: async () => {
        throw Error('offline');
      },
    }),
  );
  const permissive = {
    ...config,
    regionRules: [{ countries: ['*'], mode: 'opt-out', respectGpc: true }],
  };
  assert.equal(adaptConfig(permissive).mode, 'opt-in');
  assert.equal(adaptConfig(permissive, 'US').mode, 'opt-out');
});
