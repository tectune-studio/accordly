import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../lib/dashboard/api.ts';

describe('dashboard request', { concurrency: false }, () => {
  let descriptors;
  let calls;
  let stored;
  let respond;

  beforeEach(() => {
    descriptors = {
      fetch: Object.getOwnPropertyDescriptor(globalThis, 'fetch'),
      sessionStorage: Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage'),
    };
    calls = [];
    stored = new Map();
    respond = async () => Response.json({ success: true });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: async (url, options) => {
        calls.push({ url, options });
        return respond(url, options);
      },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => stored.set(key, String(value)),
        removeItem: (key) => stored.delete(key),
      },
    });
  });

  afterEach(() => {
    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  test('GET prefixes the API path, disables caching and returns parsed JSON', async () => {
    const result = { projects: [{ id: 'proj_test' }] };
    respond = async () => Response.json(result);

    assert.deepEqual(await request('state'), result);
    assert.deepEqual(calls, [{ url: '/api/state', options: { cache: 'no-store' } }]);
    assert.equal(stored.size, 0);
  });

  test('POST sends JSON with the content type header without mutating the payload', async () => {
    const payload = { name: 'Website', domain: 'example.com' };
    const before = structuredClone(payload);

    assert.deepEqual(await request('projects', payload), { success: true });
    assert.deepEqual(calls, [
      {
        url: '/api/projects',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      },
    ]);
    assert.deepEqual(payload, before);
    assert.equal(stored.size, 0);
  });

  test('explicit null data is still sent as a JSON POST', async () => {
    await request('projects/proj_test/draft', null);

    assert.deepEqual(calls[0].options, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    });
  });

  test('failed responses use the API error or the original fallback message', async () => {
    respond = async () => Response.json({ error: 'Permission denied' }, { status: 403 });
    await assert.rejects(request('state'), { message: 'Permission denied' });

    respond = async () => Response.json({}, { status: 500 });
    await assert.rejects(request('state'), { message: 'Request failed' });

    respond = async () => Response.json({ error: '' }, { status: 500 });
    await assert.rejects(request('state'), { message: 'Request failed' });
  });

  test('failed publish retains its retry ID, reuses it, and clears it only after success', async () => {
    const path = 'projects/proj_test/publish';
    const key = 'accordly:publish:' + path + ':draft';
    const payload = {};
    respond = async () => Response.json({ error: 'Delivery unavailable' }, { status: 503 });

    await assert.rejects(request(path, payload), { message: 'Delivery unavailable' });
    const first = JSON.parse(calls[0].options.body);
    assert.match(first.requestId, /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
    assert.equal(stored.get(key), first.requestId);
    assert.deepEqual(payload, {});

    respond = async () => Response.json({ published: true });
    assert.deepEqual(await request(path, payload), { published: true });
    assert.deepEqual(JSON.parse(calls[1].options.body), first);
    assert.equal(stored.has(key), false);

    await request(path, payload);
    assert.notEqual(JSON.parse(calls[2].options.body).requestId, first.requestId);
    assert.equal(stored.has(key), false);
  });

  test('network failures also retain the publish retry ID for the next attempt', async () => {
    const path = 'projects/proj_test/publish';
    const key = 'accordly:publish:' + path + ':draft';
    const failure = new Error('Network unavailable');
    respond = async () => {
      throw failure;
    };

    await assert.rejects(request(path, {}), failure);
    const requestId = JSON.parse(calls[0].options.body).requestId;
    assert.equal(stored.get(key), requestId);

    respond = async () => Response.json({ success: true });
    await request(path, {});
    assert.equal(JSON.parse(calls[1].options.body).requestId, requestId);
    assert.equal(stored.has(key), false);
  });

  test('invalid JSON responses do not clear a pending publish retry ID', async () => {
    const path = 'projects/proj_test/publish';
    const key = 'accordly:publish:' + path + ':draft';
    respond = async () => new Response('not JSON', { status: 200 });

    await assert.rejects(request(path, {}), SyntaxError);
    assert.equal(stored.get(key), JSON.parse(calls[0].options.body).requestId);
  });

  test('publish and rollback releases have distinct keys and clean up independently', async () => {
    const publishPath = 'projects/proj_test/publish';
    const rollbackPath = 'projects/proj_test/rollback';
    const publishKey = 'accordly:publish:' + publishPath + ':draft';
    const firstKey = 'accordly:publish:' + rollbackPath + ':release_1';
    const secondKey = 'accordly:publish:' + rollbackPath + ':release_2';
    respond = async () => Response.json({ error: 'Try again' }, { status: 503 });

    await assert.rejects(request(publishPath, {}), { message: 'Try again' });
    await assert.rejects(request(rollbackPath, { releaseId: 'release_1' }), {
      message: 'Try again',
    });
    await assert.rejects(request(rollbackPath, { releaseId: 'release_2' }), {
      message: 'Try again',
    });

    const publishId = JSON.parse(calls[0].options.body).requestId;
    const firstId = JSON.parse(calls[1].options.body).requestId;
    const secondId = JSON.parse(calls[2].options.body).requestId;
    assert.deepEqual(
      stored,
      new Map([
        [publishKey, publishId],
        [firstKey, firstId],
        [secondKey, secondId],
      ]),
    );
    assert.equal(new Set([publishId, firstId, secondId]).size, 3);

    respond = async () => Response.json({ restored: true });
    await request(rollbackPath, { releaseId: 'release_1' });
    assert.deepEqual(JSON.parse(calls[3].options.body), {
      releaseId: 'release_1',
      requestId: firstId,
    });
    assert.equal(stored.has(firstKey), false);
    assert.equal(stored.get(secondKey), secondId);
    assert.equal(stored.get(publishKey), publishId);

    await request(rollbackPath, { releaseId: 'release_2' });
    assert.deepEqual(JSON.parse(calls[4].options.body), {
      releaseId: 'release_2',
      requestId: secondId,
    });
    assert.equal(stored.has(secondKey), false);
    assert.equal(stored.get(publishKey), publishId);
  });

  for (const method of ['getItem', 'setItem', 'removeItem']) {
    test('publish tolerates sessionStorage.' + method + ' throwing', async () => {
      globalThis.sessionStorage[method] = () => {
        throw new Error('Storage disabled');
      };

      assert.deepEqual(await request('projects/proj_test/publish', {}), { success: true });
      assert.equal(typeof JSON.parse(calls[0].options.body).requestId, 'string');
    });
  }

  test('publish tolerates missing sessionStorage', async () => {
    delete globalThis.sessionStorage;

    assert.deepEqual(await request('projects/proj_test/publish', {}), { success: true });
    assert.equal(typeof JSON.parse(calls[0].options.body).requestId, 'string');
  });

  test('publish tolerates a sessionStorage getter throwing', async () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('Storage unavailable');
      },
    });

    assert.deepEqual(await request('projects/proj_test/publish', {}), { success: true });
    assert.equal(typeof JSON.parse(calls[0].options.body).requestId, 'string');
  });
});
