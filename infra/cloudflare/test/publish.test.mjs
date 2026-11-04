import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activatePointer, publishObject } from '../src/publish.mjs';
import worker from '../src/worker.ts';
import { makeConfig } from '../../../apps/dashboard/lib/domain.mjs';
import { toBannerConfig } from '../../../apps/dashboard/lib/contracts.mjs';
import { publishStep } from '../../../apps/dashboard/lib/server/publish-step.mjs';

function bucket() {
  const values = new Map();
  let serial = 0;
  return {
    values,
    async get(key) {
      const value = values.get(key);
      return value ? { etag: value.etag, text: async () => value.body } : null;
    },
    async put(key, body, options) {
      const old = values.get(key);
      if (options?.onlyIf?.etagDoesNotMatch === '*' && old) return null;
      if (options?.onlyIf?.etagMatches && old?.etag !== options.onlyIf.etagMatches) return null;
      values.set(key, { body, etag: String(++serial) });
      return { etag: String(serial) };
    },
  };
}
async function fixture() {
  const config = { ...makeConfig('proj_publish'), version: 'rel_one' };
  const banner = await toBannerConfig(config);
  const pointer = {
    projectId: config.projectId,
    releaseId: config.version,
    configHash: banner.configHash,
    generation: '1',
    verifiedUntil: new Date(Date.now() + 86400000).toISOString(),
    allowedOrigins: ['https://example.com'],
  };
  return { config, banner, pointer };
}
test('immutable writes are replayable, verified by read, and never overwrite existing bytes', async () => {
  const b = bucket(),
    data = await fixture();
  await publishObject(b, data);
  await publishObject(b, data);
  assert.equal(b.values.size, 2);
  const key = `config/proj_publish/${data.banner.configHash}.json`;
  b.values.set(key, { body: 'corrupt', etag: 'bad' });
  await assert.rejects(publishObject(b, data), /read verification/);
  assert.equal(b.values.get(key).body, 'corrupt');
  await assert.rejects(
    publishObject(bucket(), { ...data, banner: { ...data.banner, configHash: '0'.repeat(64) } }),
  );
});
test('pointer requires artifacts, supports retries, fences stale writers and detects concurrent writes', async () => {
  const b = bucket(),
    data = await fixture();
  await assert.rejects(activatePointer(b, data.pointer), /missing/);
  await publishObject(b, data);
  await activatePointer(b, data.pointer);
  await activatePointer(b, data.pointer);
  await activatePointer(b, { ...data.pointer, generation: '2' });
  await assert.rejects(activatePointer(b, data.pointer), /Stale/);
  const different = { ...data.config, version: 'rel_other', title: 'Updated notice' };
  const otherBanner = await toBannerConfig(different);
  await publishObject(b, { config: different, banner: otherBanner });
  await assert.rejects(
    activatePointer(b, { ...data.pointer, generation: '3', configHash: otherBanner.configHash }),
    /pair mismatch/,
  );
  b.put = async () => null;
  await assert.rejects(activatePointer(b, { ...data.pointer, generation: '3' }), /Concurrent/);
});
test('publication resumes after failed invalidation and process death without advancing or auditing early', async () => {
  const b = bucket(),
    data = await fixture();
  const job = {
    phase: 'validated',
    config: data.config,
    banner: data.banner,
    project_id: data.config.projectId,
    release_id: data.config.version,
    generation: 1,
    domain: 'example.com',
    verified_until: data.pointer.verifiedUntil,
  };
  let failPurge = true,
    audits = 0;
  const transport = {
    store: (config, banner) => publishObject(b, { config, banner }),
    point: (p) => activatePointer(b, p),
    invalidate: async () => {
      if (failPurge) throw new Error('purge failed');
    },
  };
  const finalize = async () => {
    audits++;
  };
  // Remote write succeeded but the process died before committing its phase.
  await publishStep(job, transport, finalize);
  job.phase = await publishStep(job, transport, finalize);
  assert.equal(job.phase, 'stored');
  await publishStep(job, transport, finalize); // another lost commit after pointer write
  job.phase = await publishStep(job, transport, finalize);
  await assert.rejects(publishStep(job, transport, finalize), /purge/);
  assert.equal(job.phase, 'pointed');
  assert.equal(audits, 0);
  failPurge = false;
  job.phase = await publishStep(job, transport, finalize);
  job.phase = await publishStep(job, transport, finalize);
  job.phase = await publishStep(job, transport, finalize);
  assert.equal(audits, 1);
  assert.equal(job.phase, 'completed');
});
test('private publishing fails closed and public current reads enforce proof expiry', async () => {
  const b = bucket(),
    data = await fixture();
  const env = { CONFIGS: b, PUBLISH_SECRET: 's'.repeat(32) };
  const req = (token) =>
    new Request('https://delivery.example/internal/publish/objects', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify(data),
    });
  assert.equal((await worker.fetch(req('wrong'), env)).status, 401);
  assert.equal(b.values.size, 0);
  assert.equal((await worker.fetch(req(env.PUBLISH_SECRET), env)).status, 200);
  await activatePointer(b, data.pointer);
  const current = new Request('https://delivery.example/v1/config/proj_publish');
  let r = await worker.fetch(current, env);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).configHash, data.banner.configHash);
  const key = 'config/proj_publish/current.json';
  b.values.set(key, {
    body: JSON.stringify({ ...data.pointer, verifiedUntil: '2000-01-01T00:00:00Z' }),
    etag: 'expired',
  });
  assert.equal((await worker.fetch(current, env)).status, 404);
});
