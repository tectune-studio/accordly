import { validateReceipt } from '../../../apps/dashboard/lib/domain.mjs';
interface ObjectBody {
  text(): Promise<string>;
  httpEtag: string;
}
interface Bucket {
  get(key: string): Promise<ObjectBody | null>;
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}
interface Env {
  CONFIGS: Bucket;
  RECEIPTS: Bucket;
  CONSENT_QUEUE: { send(value: unknown): Promise<void> };
  INGEST_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}
interface Message {
  body: { projectId: string; receiptId: string; receivedAt: string };
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
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 16384) {
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
async function getConfig(env: Env, project: string, version: string) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(project) || !/^[a-zA-Z0-9_-]{1,80}$/.test(version)) return null;
  const obj = await env.CONFIGS.get(`config/${project}/${version}.json`);
  return obj ? JSON.parse(await obj.text()) : null;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    try {
      if (request.method === 'GET' && segments[0] === 'config' && segments.length === 3) {
        const [, project, version] = segments;
        const cacheKey = new Request(url.toString());
        const cache = (caches as CacheStorage & { default: Cache }).default;
        const hit = await cache.match(cacheKey);
        if (hit) return hit;
        const config = await getConfig(env, project, version);
        if (!config) return response({ error: 'Not found' }, 404);
        const result = response(config, 200, {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control':
            version === 'current' ? 'public,max-age=30' : 'public,max-age=31536000,immutable',
        });
        await cache.put(cacheKey, result.clone());
        return result;
      }
      if (request.method === 'GET' && segments.join('/') === 'sdk/0.1.0/consent.js') {
        const obj = await env.CONFIGS.get('sdk/0.1.0/consent.js');
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
        const release = await getConfig(env, segments[1], String(input.configurationVersion));
        if (!release) return response({ error: 'Unknown release' }, 400, cors);
        const receipt = validateReceipt(input, release);
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
        await env.RECEIPTS.put(`receipts/${r.projectId}/${r.receiptId}.json`, JSON.stringify(r), {
          onlyIf: { etagDoesNotMatch: '*' },
          httpMetadata: { contentType: 'application/json' },
        });
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};
