export function publishTransport(env = process.env, fetcher = fetch) {
  const origin = new URL(env.ACCORDLY_DELIVERY_ORIGIN || 'http://unconfigured');
  if (
    origin.protocol !== 'https:' ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    !env.ACCORDLY_PUBLISH_SECRET ||
    env.ACCORDLY_PUBLISH_SECRET.length < 32 ||
    !/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ZONE_ID || '') ||
    !env.CLOUDFLARE_API_TOKEN
  )
    throw new Error('Cloudflare publish environment is incomplete');
  async function post(url, token, body) {
    const r = await fetcher(url, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('Publish dependency failed');
    return r.json();
  }
  return {
    async store(config, banner) {
      const r = await post(
        origin.origin + '/internal/publish/objects',
        env.ACCORDLY_PUBLISH_SECRET,
        { config, banner },
      );
      if (r.verified !== true) throw new Error('Read verification missing');
    },
    async point(pointer) {
      const r = await post(
        origin.origin + '/internal/publish/current',
        env.ACCORDLY_PUBLISH_SECRET,
        pointer,
      );
      if (r.activated !== true) throw new Error('Pointer verification missing');
    },
    async invalidate(projectId) {
      const r = await post(
        `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        env.CLOUDFLARE_API_TOKEN,
        {
          files: [
            `${origin.origin}/config/${projectId}/current`,
            `${origin.origin}/v1/config/${projectId}`,
          ],
        },
      );
      if (r.success !== true) throw new Error('Cache invalidation failed');
    },
  };
}
