import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createChallenge,
  verifyChallenge,
  isPublicAddress,
  normalizeHostname,
} from '../lib/server/domain-verification.mjs';
test('challenges have unique 256-bit tokens and bind to exact public hostnames', () => {
  const a = createChallenge('EXAMPLE.COM', 'dns'),
    b = createChallenge('example.com', 'dns');
  assert.equal(a.domain, 'example.com');
  assert.notEqual(a.token, b.token);
  assert.equal(a.tokenHash.length, 64);
  for (const name of [
    'localhost',
    '127.0.0.1',
    'https://example.com',
    '*.example.com',
    'a.local',
    'a.example',
    'a.com:443',
  ])
    assert.throws(() => normalizeHostname(name));
});
test('DNS TXT verification joins record chunks and rejects a different challenge', async () => {
  const c = createChallenge('example.com', 'dns');
  const queries = [];
  assert.equal(
    await verifyChallenge(c, {
      txt: async (name) => {
        queries.push(name);
        return [[c.token.slice(0, 25), c.token.slice(25)]];
      },
    }),
    true,
  );
  assert.deepEqual(queries, ['_accordly-challenge.example.com']);
  assert.equal(await verifyChallenge(c, { txt: async () => [['wrong']] }), false);
});
test('expired challenges do not perform network requests', async () => {
  const c = createChallenge('example.com', 'dns', 0);
  await assert.rejects(
    verifyChallenge(c, {
      txt: async () => {
        throw new Error('Network should not run');
      },
    }),
    /expired/,
  );
});
test('HTTP verification pins a public address and requires exact token content', async () => {
  const c = createChallenge('example.com', 'http');
  assert.equal(
    await verifyChallenge(c, {
      addresses: async () => ['93.184.215.14'],
      https: async (host, address) => {
        assert.equal(host, 'example.com');
        assert.equal(address, '93.184.215.14');
        return c.token + '\n';
      },
    }),
    true,
  );
  assert.equal(
    await verifyChallenge(c, {
      addresses: async () => ['93.184.215.14'],
      https: async () => '<html>' + c.token + '</html>',
    }),
    false,
  );
});
test('HTTP rejects private, mixed, mapped IPv6 and metadata destinations before connecting', async () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '100.64.0.1',
    '::1',
    '::ffff:127.0.0.1',
    '224.0.0.1',
    '198.18.0.1',
  ]) {
    assert.equal(isPublicAddress(address), false);
    await assert.rejects(
      verifyChallenge(createChallenge('example.com', 'http'), {
        addresses: async () => ['93.184.215.14', address],
        https: async () => {
          throw new Error('Must not connect');
        },
      }),
      /public IPv4/,
    );
  }
});
