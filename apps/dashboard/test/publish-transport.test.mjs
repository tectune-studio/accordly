import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PublishDependencyError, publishTransport } from '../lib/server/publish-transport.mjs';
test('purge failures expose safe recovery guidance without leaking dependency responses', async () => {
  for (const status of [401, 403, 429, 503]) {
    const transport = publishTransport(
      env,
      async () => new Response('private upstream details', { status }),
    );
    await assert.rejects(transport.invalidate('proj_test'), (error) => {
      assert.ok(error instanceof PublishDependencyError);
      assert.match(error.message, new RegExp(`HTTP ${status}`));
      assert.match(error.message, /Cache Purge permission/);
      assert.ok(!error.message.includes('private upstream details'));
      assert.ok(!error.message.includes(env.CLOUDFLARE_API_TOKEN));
      return true;
    });
  }
  for (const response of [
    Response.json({ success: false }),
    Response.json(null),
    new Response('not JSON'),
  ]) {
    const transport = publishTransport(env, async () => response);
    await assert.rejects(transport.invalidate('proj_test'), PublishDependencyError);
  }
  const transport = publishTransport(env, async () => {
    throw new Error('private network details');
  });
  await assert.rejects(
    transport.invalidate('proj_test'),
    /Cloudflare cache purge could not connect or timed out/,
  );
});

const env = {
  ACCORDLY_DELIVERY_ORIGIN: 'https://delivery.example',
  ACCORDLY_PUBLISH_SECRET: 'p'.repeat(32),
  CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
  CLOUDFLARE_API_TOKEN: 'test-token',
};
test('publish transport requires complete server configuration and positive dependency acknowledgements', async () => {
  assert.throws(() => publishTransport({}), /incomplete/);
  assert.throws(() =>
    publishTransport({ ...env, ACCORDLY_DELIVERY_ORIGIN: 'http://delivery.example' }),
  );
  const calls = [];
  const transport = publishTransport(env, async (url, options) => {
    calls.push({ url, options });
    return Response.json({ verified: true, activated: true, success: true });
  });
  await transport.store({}, {});
  await transport.point({});
  await transport.invalidate('proj_test');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer ' + env.ACCORDLY_PUBLISH_SECRET);
  assert.equal(calls[2].options.headers.Authorization, 'Bearer ' + env.CLOUDFLARE_API_TOKEN);
  assert.deepEqual(JSON.parse(calls[2].options.body).files, [
    'https://delivery.example/config/proj_test/current',
    'https://delivery.example/v1/config/proj_test',
  ]);
  const failed = publishTransport(env, async () => Response.json({ success: false }));
  await assert.rejects(failed.invalidate('proj_test'));
  await assert.rejects(failed.store({}, {}));
  const unavailable = publishTransport(env, async () => new Response('', { status: 503 }));
  await assert.rejects(unavailable.point({}));
});
