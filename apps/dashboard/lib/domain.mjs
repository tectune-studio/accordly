import { validateConfig } from '@accordly/core';
export const DEFAULT_PURPOSES = [
  {
    id: 'necessary',
    name: 'Strictly necessary',
    description: 'Essential security and preference storage. Always active.',
    required: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Help us understand how our website is used.',
    required: false,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Allow personalized advertising and campaign measurement.',
    required: false,
  },
];
export function makeConfig(projectId) {
  return {
    projectId,
    version: 'draft',
    title: 'Your privacy, your choice.',
    description:
      'We use cookies to keep things running smoothly. You decide what else you’re comfortable with.',
    privacyUrl: 'https://example.com/privacy',
    expirationDays: 180,
    brandColor: '#177d65',
    purposes: structuredClone(DEFAULT_PURPOSES),
  };
}
export function parseProject(input) {
  if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 80)
    throw new Error('Enter a project name (1–80 characters).');
  const domain = String(input.domain || '')
    .trim()
    .toLowerCase();
  if (
    !/^(?=.{1,253}$)(localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})$/.test(
      domain,
    )
  )
    throw new Error('Enter a hostname, such as example.com, without a URL or path.');
  return { name: input.name.trim(), domain };
}
export function parseConfig(input, projectId) {
  const config = { ...input, projectId, version: 'draft' };
  for (const key of ['title', 'description', 'privacyUrl', 'brandColor'])
    if (typeof config[key] !== 'string' || config[key].length > 1000)
      throw new Error('Invalid banner text.');
  if (!/^#[a-f0-9]{6}$/i.test(config.brandColor)) throw new Error('Choose a valid brand color.');
  let url;
  try {
    url = new URL(config.privacyUrl);
  } catch {
    throw new Error('Enter an absolute privacy policy URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Privacy URL must use HTTP or HTTPS.');
  validateConfig(config);
  if (config.purposes.some((p) => p.name.length > 100 || p.description.length > 500))
    throw new Error('Purpose text is too long.');
  return {
    projectId,
    version: 'draft',
    title: config.title,
    description: config.description,
    privacyUrl: config.privacyUrl,
    brandColor: config.brandColor,
    expirationDays: config.expirationDays,
    purposes: config.purposes,
  };
}
export function validateReceipt(input, config) {
  if (!input || typeof input.receiptId !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.receiptId))
    throw new Error('Invalid receipt identifier');
  if (input.projectId !== config.projectId || input.configurationVersion !== config.version)
    throw new Error('Unknown release');
  if (!['accept', 'reject', 'customize', 'withdraw'].includes(input.action))
    throw new Error('Invalid decision');
  const time = Date.parse(input.clientTimestamp);
  if (!Number.isFinite(time) || time > Date.now() + 300000 || time < Date.now() - 7 * 86400000)
    throw new Error('Invalid receipt timestamp');
  if (!input.choices || Object.keys(input.choices).length !== config.purposes.length)
    throw new Error('Invalid choices');
  for (const p of config.purposes) {
    if (typeof input.choices[p.id] !== 'boolean' || (p.required && !input.choices[p.id]))
      throw new Error('Required purposes must remain enabled');
    if (!p.required && input.action === 'accept' && !input.choices[p.id])
      throw new Error('Accept action must enable optional purposes');
    if (!p.required && ['reject', 'withdraw'].includes(input.action) && input.choices[p.id])
      throw new Error('Reject action must deny optional purposes');
  }
  return {
    receiptId: input.receiptId,
    projectId: config.projectId,
    configurationVersion: config.version,
    choices: input.choices,
    action: input.action,
    clientTimestamp: new Date(time).toISOString(),
    sdkVersion: String(input.sdkVersion || 'unknown').slice(0, 30),
    source: 'banner',
  };
}
