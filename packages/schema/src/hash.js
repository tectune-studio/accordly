// Canonical contract: recursively sorted object keys, array order retained, UTF-8 JSON.
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical(value[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export async function configHash(config) {
  const { configHash: ignored, ...content } = config;
  return [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(content))),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
