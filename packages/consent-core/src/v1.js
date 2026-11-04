export function uuidv7() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let t = BigInt(Date.now());
  for (let i = 5; i >= 0; i--) {
    b[i] = Number(t & 255n);
    t >>= 8n;
  }
  b[6] = (b[6] & 15) | 112;
  b[8] = (b[8] & 63) | 128;
  const h = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function adaptConfig(c, country, language) {
  if (c.schemaVersion !== 1) throw new Error('Unsupported schemaVersion');
  const text = c.texts[language] || c.texts[c.defaultLanguage];
  const rule =
    c.regionRules.find((r) => r.countries.includes(country)) ||
    c.regionRules.find((r) => r.countries.includes('*'));
  return {
    projectId: c.projectId,
    version: c.configHash,
    title: text.title,
    description: text.description,
    privacyUrl: text.privacyUrl,
    expirationDays: c.behavior.cookieLifetimeDays,
    brandColor: c.theme.accent,
    purposes: c.categories.map((p) => ({
      id: p.id,
      name: p.id[0].toUpperCase() + p.id.slice(1),
      description: p.services.map((s) => s.name).join(', '),
      required: p.id === 'necessary',
    })),
    respectGpc: rule?.respectGpc,
    gpcCategories: rule?.gpcCategories,
    mode: rule?.mode,
    repromptOnConfigChange: c.behavior.repromptOnConfigChange,
    text,
    theme: c.theme,
    consentWall: c.behavior.consentWall,
    scriptRules: c.scriptRules,
  };
}
export function subjectId(storage) {
  const key = 'consentkit:subject';
  let id;
  try {
    id = storage?.getItem(key);
  } catch {}
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(id || '')) {
    id = crypto.randomUUID().replaceAll('-', '');
    try {
      storage?.setItem(key, id);
    } catch {}
  }
  return id;
}
