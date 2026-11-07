import { validateEvent } from '../../../apps/dashboard/lib/contracts.mjs';

export async function writeEvent(env, envelope) {
  if (!env.HYPERDRIVE?.connectionString) throw new Error('Hyperdrive binding missing');
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    await client.connect();
    const result = await client.query(
      'select accordly.ingest_worker_event($1,$2::jsonb) as duplicate',
      [envelope.origin, JSON.stringify(envelope.event)],
    );
    return result.rows[0].duplicate;
  } finally {
    await client.end().catch(() => {});
  }
}

export async function ingest(request, env, write = writeEvent) {
  const reply = (body, status, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
    });
  const project = new URL(request.url).searchParams.get('projectId');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(project || ''))
    return reply({ error: 'projectId query parameter required' }, 400);
  const origin = request.headers.get('Origin');
  if (!origin || origin === 'null') return reply({ error: 'Origin required' }, 403);
  let cors = {};
  try {
    const object = await env.CONFIGS.get(`config/${project}/current.json`);
    const pointer = object && JSON.parse(await object.text());
    if (
      !pointer ||
      !(Date.parse(pointer.verifiedUntil) > Date.now()) ||
      !pointer.allowedOrigins?.includes(origin)
    )
      return reply({ error: 'Origin not enabled' }, 403);
    cors = {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, cors);
    const limit = await env.INGEST_LIMITER.limit({
      key: `${project}:${request.headers.get('CF-Connecting-IP') || 'unknown'}`,
    });
    if (!limit.success)
      return reply({ error: 'Rate limited' }, 429, { ...cors, 'Retry-After': '60' });
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: 'Body required' }, 400, cors);
    let size = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16384) {
        await reader.cancel();
        return reply({ error: 'Body too large' }, 413, cors);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let event;
    try {
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (
        input.projectId !== project ||
        input.schemaVersion !== 1 ||
        !/^[a-f0-9]{64}$/.test(input.configHash || '')
      )
        throw Error('Invalid event');
      const artifact = await env.CONFIGS.get(`config/${project}/${input.configHash}.json`);
      if (!artifact) return reply({ error: 'Unknown configuration' }, 400, cors);
      event = validateEvent(input, JSON.parse(await artifact.text()));
    } catch {
      return reply({ error: 'Invalid consent event' }, 400, cors);
    }
    const envelope = { kind: 'accordly-ingest-v1', origin, event };
    try {
      const duplicate = await write(env, envelope);
      return reply({ accepted: true, duplicate }, 200, cors);
    } catch (error) {
      if (error.code === '23505') return reply({ error: 'Event ID conflict' }, 409, cors);
      if (['P0001', '22P02', '23503', '23514'].includes(error.code))
        return reply({ error: 'Event rejected' }, 400, cors);
      try {
        await env.CONSENT_QUEUE.send(envelope);
        return reply({ accepted: true, queued: true }, 202, cors);
      } catch {
        return reply({ error: 'Persistence unavailable; retry this event' }, 503, {
          ...cors,
          'Retry-After': '60',
        });
      }
    }
  } catch {
    return reply({ error: 'Service unavailable; retry this event' }, 503, {
      ...cors,
      'Retry-After': '60',
    });
  }
}
