import { configHash } from '../../../packages/schema/src/hash.js';
import { BannerConfigSchema, ConsentEventSchema } from '../../../packages/schema/src/index.js';
export async function toBannerConfig(legacy) {
  const c = {
    schemaVersion: 1,
    projectId: legacy.projectId,
    configHash: '0'.repeat(64),
    categories: ['necessary', 'analytics', 'marketing', 'functional'].map((id) => ({
      id,
      services: [],
    })),
    scriptRules: [],
    googleSignals: {
      ad_storage: 'marketing',
      analytics_storage: 'analytics',
      ad_user_data: 'marketing',
      ad_personalization: 'marketing',
    },
    regionRules: [
      { countries: ['*'], mode: 'opt-in', respectGpc: true, gpcCategories: ['marketing'] },
    ],
    texts: {
      en: {
        title: legacy.title,
        description: legacy.description,
        acceptAll: 'Accept all',
        rejectAll: 'Reject all',
        save: 'Save preferences',
        preferences: 'Privacy preferences',
        privacyUrl: legacy.privacyUrl,
      },
    },
    defaultLanguage: 'en',
    theme: {
      background: '#ffffff',
      foreground: '#172b29',
      accent: legacy.brandColor || '#166b58',
      fontFamily: 'system-ui',
      position: 'bottom',
    },
    behavior: {
      cookieLifetimeDays: legacy.expirationDays,
      repromptOnConfigChange: true,
      consentWall: false,
    },
  };
  c.configHash = await configHash(c);
  return BannerConfigSchema.parse(c);
}
export function validateEvent(input, config) {
  const event = ConsentEventSchema.parse(input);
  if (event.projectId !== config.projectId || event.configHash !== config.configHash)
    throw new Error('Configuration hash mismatch');
  const allowed = config.categories.filter((c) => c.id !== 'necessary').map((c) => c.id);
  if (Object.keys(event.choices).some((k) => !allowed.includes(k)))
    throw new Error('Unknown category');
  if (
    ['reject_all', 'withdraw'].includes(event.action) &&
    Object.values(event.choices).some(Boolean)
  )
    throw new Error('Rejected choices must be disabled');
  if (event.action === 'accept_all' && allowed.some((k) => event.choices[k] !== true))
    throw new Error('Accept all must enable all optional categories');
  return event;
}
