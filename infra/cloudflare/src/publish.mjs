import { BannerConfigSchema } from '../../../packages/schema/src/index.js';
import { canonical, configHash } from '../../../packages/schema/src/hash.js';
import { parseConfig } from '../../../apps/dashboard/lib/domain.mjs';
import { toBannerConfig } from '../../../apps/dashboard/lib/contracts.mjs';

// All mutations use conditional writes. A timed-out request can safely be replayed.
export async function publishObject(bucket, input) {
  const banner = BannerConfigSchema.parse(input.banner);
  const config = parseConfig(input.config, banner.projectId);
  if (
    input.config.projectId !== banner.projectId ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(banner.projectId) ||
    canonical(await toBannerConfig(config)) !== canonical(banner)
  )
    throw new Error('Configuration documents disagree');
  if (
    (await configHash(banner)) !== banner.configHash ||
    !/^rel_[a-zA-Z0-9_-]+$/.test(input.config.version)
  )
    throw new Error('Invalid artifact');
  const objects = [
    [`config/${banner.projectId}/${banner.configHash}.json`, canonical(banner)],
    [
      `config/${banner.projectId}/${input.config.version}.json`,
      canonical({ ...config, version: input.config.version }),
    ],
  ];
  for (const [key, body] of objects) {
    await bucket.put(key, body, {
      onlyIf: { etagDoesNotMatch: '*' },
      httpMetadata: { contentType: 'application/json' },
    });
    const stored = await bucket.get(key);
    if (!stored || (await stored.text()) !== body)
      throw new Error('Immutable object read verification failed');
  }
  return { verified: true };
}

export async function activatePointer(bucket, pointer) {
  if (
    !/^[a-zA-Z0-9_-]{1,80}$/.test(pointer.projectId) ||
    !/^rel_[a-zA-Z0-9_-]+$/.test(pointer.releaseId) ||
    !/^[a-f0-9]{64}$/.test(pointer.configHash) ||
    !/^[1-9][0-9]*$/.test(pointer.generation) ||
    !Number.isFinite(Date.parse(pointer.verifiedUntil)) ||
    Date.parse(pointer.verifiedUntil) <= Date.now() ||
    !Array.isArray(pointer.allowedOrigins) ||
    pointer.allowedOrigins.length !== 1 ||
    !/^https:\/\/[a-z0-9.-]+$/.test(pointer.allowedOrigins[0])
  )
    throw new Error('Invalid pointer');
  const prefix = `config/${pointer.projectId}/`;
  const banner = await bucket.get(prefix + pointer.configHash + '.json');
  const legacy = await bucket.get(prefix + pointer.releaseId + '.json');
  if (!banner || !legacy) throw new Error('Artifact missing');
  const parsed = BannerConfigSchema.parse(JSON.parse(await banner.text()));
  if ((await configHash(parsed)) !== pointer.configHash || parsed.projectId !== pointer.projectId)
    throw new Error('Artifact mismatch');
  const config = JSON.parse(await legacy.text());
  if (
    config.projectId !== pointer.projectId ||
    config.version !== pointer.releaseId ||
    canonical(await toBannerConfig(parseConfig(config, pointer.projectId))) !== canonical(parsed)
  )
    throw new Error('Artifact pair mismatch');
  const body = canonical(pointer);
  const key = prefix + 'current.json';
  const previous = await bucket.get(key);
  if (previous) {
    const oldBody = await previous.text();
    if (oldBody === body) return { activated: true };
    const old = JSON.parse(oldBody);
    if (old.generation && BigInt(old.generation) >= BigInt(pointer.generation))
      throw new Error('Stale publication');
  }
  const written = await bucket.put(key, body, {
    onlyIf: previous ? { etagMatches: previous.etag } : { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json' },
  });
  if (!written) throw new Error('Concurrent publication; retry');
  const read = await bucket.get(key);
  if (!read || (await read.text()) !== body) throw new Error('Pointer read verification failed');
  return { activated: true };
}

export async function authorized(request, secret) {
  if (!secret || secret.length < 32) return false;
  const digest = async (s) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([
    digest(request.headers.get('authorization') || ''),
    digest('Bearer ' + secret),
  ]);
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}
