/** Explicitly opt-in hosted delivery. Initializing never creates telemetry. */
export function createEventTransport({
  endpoint,
  projectId,
  storage,
  fetcher = globalThis.fetch,
  onError = () => {},
  now = Date.now,
  schedule = setTimeout,
  cancel = clearTimeout,
  maximum = 100,
  maximumBytes = 200000,
  autoStart = true,
} = {}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || !projectId)
    throw Error('Invalid ingestion endpoint');
  url.searchParams.set('projectId', projectId);
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  const key = `accordly:outbox:${url.href}`;
  const report = (error) => {
    try {
      onError(error);
    } catch {}
  };
  let items = [],
    timer,
    running = false,
    stopped = false;
  try {
    const saved = JSON.parse(storage?.getItem(key) || '[]');
    if (
      Array.isArray(saved) &&
      saved.length <= maximum &&
      JSON.stringify(saved).length <= maximumBytes
    )
      items = saved.filter(
        (x) =>
          x?.event?.projectId === projectId &&
          typeof x.event.eventId === 'string' &&
          Number.isFinite(x.attempts) &&
          Number.isFinite(x.next),
      );
  } catch (error) {
    report(error);
  }
  const persist = () => {
    try {
      if (!storage) throw Error('Persistent storage unavailable; outbox is in memory');
      storage.setItem(key, JSON.stringify(items));
    } catch (error) {
      report(error);
    }
  };
  const arm = () => {
    if (stopped || !items.length || running) return;
    cancel(timer);
    timer = schedule(
      () => {
        void flush();
      },
      Math.max(0, Math.min(...items.map((x) => x.next)) - now()),
    );
  };
  async function flush() {
    if (stopped || running) return;
    running = true;
    try {
      for (const item of [...items]) {
        if (stopped || item.next > now()) continue;
        try {
          const response = await fetcher(url.href, {
            method: 'POST',
            credentials: 'omit',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.event),
            signal: AbortSignal.timeout(10000),
          });
          if (![200, 202].includes(response.status) || (await response.json()).accepted !== true)
            throw Error(`Ingestion not acknowledged (${response.status})`);
          items = items.filter((x) => x !== item);
        } catch (error) {
          item.attempts++;
          item.next = now() + Math.min(3600000, 30000 * 2 ** Math.min(item.attempts - 1, 7));
          report(error);
        }
        persist();
      }
    } finally {
      running = false;
      arm();
    }
  }
  const online = () => {
    void flush();
  };
  if (autoStart) {
    globalThis.addEventListener?.('online', online);
    arm();
  }
  return {
    enqueue(event) {
      if (stopped || event?.schemaVersion !== 1 || event.projectId !== projectId || !event.eventId)
        throw Error('Invalid event for outbox');
      if (items.some((x) => x.event.eventId === event.eventId)) return;
      const item = { event: JSON.parse(JSON.stringify(event)), attempts: 0, next: now() };
      if (items.length >= maximum || JSON.stringify([...items, item]).length > maximumBytes) {
        const error = Error('Consent outbox full; event was not queued');
        report(error);
        throw error;
      }
      items.push(item);
      persist();
      if (autoStart) arm();
    },
    flush,
    pending: () => items.length,
    stop() {
      stopped = true;
      cancel(timer);
      globalThis.removeEventListener?.('online', online);
    },
  };
}
