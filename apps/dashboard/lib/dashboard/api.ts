export async function request<T = unknown>(path: string, data?: unknown): Promise<T> {
  let retryKey: string | undefined;
  if (data && /\/publish$|\/rollback$/.test(path)) {
    const payload = data as Record<string, unknown>;
    retryKey = 'accordly:publish:' + path + ':' + String(payload.releaseId || 'draft');
    let requestId = crypto.randomUUID();
    try {
      requestId = (sessionStorage.getItem(retryKey) || requestId) as typeof requestId;
      sessionStorage.setItem(retryKey, requestId);
    } catch {
      /* Storage may be disabled; the server can still resume a pending job. */
    }
    data = { ...payload, requestId };
  }
  const response = await fetch(
    '/api/' + path,
    data === undefined
      ? { cache: 'no-store' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed');
  if (retryKey) {
    try {
      sessionStorage.removeItem(retryKey);
    } catch {}
  }
  return result as T;
}
