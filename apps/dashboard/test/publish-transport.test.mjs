import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishTransport } from '../lib/server/publish-transport.mjs';
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
