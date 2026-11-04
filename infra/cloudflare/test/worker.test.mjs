import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.ts';
import { makeConfig } from '../../../apps/dashboard/lib/domain.mjs';
const cache = new Map();
globalThis.caches = {
  default: {
    async match(request) {
      return cache.get(request.url)?.clone();
    },
    async put(request, value) {
      cache.set(request.url, value.clone());
    },
  },
};
const config = {
  ...makeConfig('edge_project'),
  version: 'release_1',
  allowedOrigins: ['https://client.example'],
  domainVerified: true,
};
function env() {
  const sent = [],
    written = [];
  return {
    sent,
    written,
    CONFIGS: {
      async get(key) {
        return key === 'config/edge_project/current.json' ||
          key === 'config/edge_project/release_1.json'
          ? { text: async () => JSON.stringify(config) }
          : null;
      },
    },
    RECEIPTS: {
      async put(key, value, options) {
        written.push({ key, value, options });
      },
    },
    CONSENT_QUEUE: {
      async send(value) {
        sent.push(value);
      },
    },
    INGEST_LIMITER: {
      async limit() {
        return { success: true };
      },
    },
  };
}
const receipt = () => ({
  receiptId: crypto.randomUUID(),
  projectId: 'edge_project',
  configurationVersion: 'release_1',
  choices: { necessary: true, analytics: false, marketing: false },
  action: 'reject',
  clientTimestamp: new Date().toISOString(),
});
test('edge configuration delivery uses immutable cache policy and rejects unknown releases', async () => {
  const e = env();
  let r = await worker.fetch(
    new Request('https://delivery.example/config/edge_project/release_1'),
    e,
  );
  assert.equal(r.status, 200);
  assert.match(r.headers.get('cache-control'), /immutable/);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  r = await worker.fetch(new Request('https://delivery.example/config/edge_project/unknown'), e);
  assert.equal(r.status, 404);
});
test('edge ingestion enforces verified origin, validates and queues receipt without IP storage', async () => {
  const e = env();
  const url = 'https://delivery.example/receipts/edge_project';
  let r = await worker.fetch(
    new Request(url, { method: 'POST', body: JSON.stringify(receipt()) }),
    e,
  );
  assert.equal(r.status, 403);
  r = await worker.fetch(
    new Request(url, {
      method: 'POST',
      headers: { Origin: 'https://client.example', 'CF-Connecting-IP': '192.0.2.1' },
      body: JSON.stringify(receipt()),
    }),
    e,
  );
  assert.equal(r.status, 202);
  assert.equal(e.sent.length, 1);
  assert.equal(e.sent[0].action, 'reject');
  assert.equal('ip' in e.sent[0], false);
  r = await worker.fetch(
    new Request(url, { method: 'OPTIONS', headers: { Origin: 'https://client.example' } }),
    e,
  );
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), 'https://client.example');
});
test('edge rate limiting rejects traffic without queue writes', async () => {
  const e = env();
  e.INGEST_LIMITER.limit = async () => ({ success: false });
  const r = await worker.fetch(
    new Request('https://delivery.example/receipts/edge_project', {
      method: 'POST',
      headers: { Origin: 'https://client.example' },
      body: JSON.stringify(receipt()),
    }),
    e,
  );
  assert.equal(r.status, 429);
  assert.equal(e.sent.length, 0);
});
test('queue consumer uses deterministic conditional keys and retries failed writes', async () => {
  const e = env();
  let acks = 0,
    retries = 0;
  const message = {
    body: { ...receipt(), receivedAt: new Date().toISOString() },
    ack() {
      acks++;
    },
    retry() {
      retries++;
    },
  };
  await worker.queue({ messages: [message] }, e);
  assert.equal(acks, 1);
  assert.equal(e.written[0].key, `receipts/edge_project/${message.body.receiptId}.json`);
  assert.equal(e.written[0].options.onlyIf.etagDoesNotMatch, '*');
  e.RECEIPTS.put = async () => {
    throw new Error('unavailable');
  };
  await worker.queue({ messages: [message] }, e);
  assert.equal(retries, 1);
});
