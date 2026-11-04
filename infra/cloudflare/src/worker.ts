import { validateEvent } from '../../../apps/dashboard/lib/contracts.mjs';
import { validateReceipt } from '../../../apps/dashboard/lib/domain.mjs';
import { activatePointer, authorized, publishObject } from './publish.mjs';
interface ObjectBody {
  text(): Promise<string>;
  httpEtag: string;
  etag: string;
}
interface Bucket {
  get(key: string): Promise<ObjectBody | null>;
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}
interface Env {
  PUBLISH_SECRET?: string;
  CONFIGS: Bucket;
  RECEIPTS: Bucket;
  CONSENT_QUEUE: { send(value: unknown): Promise<void> };
  INGEST_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}
interface Message {
  body: { projectId: string; receiptId?: string; eventId?: string; receivedAt: string };
  ack(): void;
  retry(): void;
}
const response = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
async function readBody(request: Request, maximum = 16384) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function getConfig(env: Env, project: string, version: string, banner = false): Promise<any> {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(project) || !/^[a-zA-Z0-9_-]{1,80}$/.test(version)) return null;
  const obj = await env.CONFIGS.get(`config/${project}/${version}.json`);
  if (!obj) return null;
  const value = JSON.parse(await obj.text());
  if (version === 'current' && value.generation) {
    if (Date.parse(value.verifiedUntil) <= Date.now()) return null;
    const artifact = await getConfig(env, project, banner ? value.configHash : value.releaseId);
    return artifact
      ? { ...artifact, allowedOrigins: value.allowedOrigins, domainVerified: true }
      : null;
  }
  return value;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    try {
      if (segments[0] === 'internal') {
        if (!(await authorized(request, env.PUBLISH_SECRET)))
          return response({ error: 'Unauthorized' }, 401);
        if (request.method !== 'POST' || segments[1] !== 'publish' || segments.length !== 3)
          return response({ error: 'Not found' }, 404);
        const body = await readBody(request, 131072);
        if (segments[2] === 'objects') return response(await publishObject(env.CONFIGS, body));
        if (segments[2] === 'current') return response(await activatePointer(env.CONFIGS, body));
        return response({ error: 'Not found' }, 404);
      }
      if (
        request.method === 'GET' &&
        segments[0] === 'v1' &&
        segments[1] === 'config' &&
        segments.length === 3
      ) {
        const config = await getConfig(env, segments[2], 'current', true);
        return config
          ? response(config, 200, {
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-store',
            })
          : response({ error: 'Not found' }, 404);
      }
      if (request.method === 'GET' && segments[0] === 'config' && segments.length === 3) {
        const [, project, version] = segments;
        // Canonical URLs prevent query variants escaping targeted invalidation.
        const cacheKey = new Request(url.origin + url.pathname);
        const cache = (caches as CacheStorage & { default: Cache }).default;
        const hit = version === 'current' ? undefined : await cache.match(cacheKey);
        if (hit) return hit;
        const config = await getConfig(env, project, version);
        if (!config) return response({ error: 'Not found' }, 404);
        const result = response(config, 200, {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': version === 'current' ? 'no-store' : 'public,max-age=31536000,immutable',
        });
        if (version !== 'current') await cache.put(cacheKey, result.clone());
        return result;
      }
      if (
        request.method === 'GET' &&
        segments[0] === 'sdk' &&
        ['0.1.0', '0.2.0'].includes(segments[1]) &&
        ['consent.js', 'ui.js', 'blocking.js', 'v1.js', 'loader.js'].includes(segments[2]) &&
        segments.length === 3
      ) {
        const obj = await env.CONFIGS.get(segments.join('/'));
        if (!obj) return response({ error: 'SDK not uploaded' }, 404);
        return new Response(await obj.text(), {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public,max-age=31536000,immutable',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      if (segments[0] === 'receipts' && segments.length === 2) {
        const artifact = await getConfig(env, segments[1], 'current');
        const origin = request.headers.get('Origin');
        if (!artifact?.domainVerified || !origin || !artifact.allowedOrigins?.includes(origin))
          return response({ error: 'Origin not enabled' }, 403);
        const cors = {
          'Access-Control-Allow-Origin': origin,
          Vary: 'Origin',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        };
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405, cors);
        const limit = await env.INGEST_LIMITER.limit({
          key: segments[1] + ':' + request.headers.get('CF-Connecting-IP'),
        });
        if (!limit.success)
          return response({ error: 'Rate limited' }, 429, { ...cors, 'Retry-After': '60' });
        const input = await readBody(request);
        const release = await getConfig(
          env,
          segments[1],
          String(input.schemaVersion === 1 ? input.configHash : input.configurationVersion),
        );
        if (!release) return response({ error: 'Unknown release' }, 400, cors);
        const receipt =
          input.schemaVersion === 1
            ? validateEvent(input, release)
            : validateReceipt(input, release);
        await env.CONSENT_QUEUE.send({ ...receipt, receivedAt: new Date().toISOString() });
        return response({ accepted: true }, 202, cors);
      }
      return response({ error: 'Not found' }, 404);
    } catch {
      return response({ error: 'Request rejected or service unavailable' }, 400);
    }
  },
  async queue(batch: { messages: Message[] }, env: Env) {
    for (const message of batch.messages) {
      try {
        const r = message.body;
        // Deterministic object key makes redelivery idempotent. R2 bucket lifecycle handles retention.
        await env.RECEIPTS.put(
          `receipts/${r.projectId}/${r.eventId || r.receiptId}.json`,
          JSON.stringify(r),
          {
            onlyIf: { etagDoesNotMatch: '*' },
            httpMetadata: { contentType: 'application/json' },
          },
        );
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};
