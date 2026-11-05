// Generated from JSON Schema. Run npm run generate -w @accordly/schema.
import { z } from 'zod';
export const BannerConfigReader = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.string().min(1),
    configHash: z.string().regex(new RegExp('^[a-f0-9]{64}$')),
    categories: z
      .array(
        z.object({
          id: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
          services: z.array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              cookiePatterns: z.array(z.string().min(1)),
            }),
          ),
        }),
      )
      .min(4)
      .max(4),
    scriptRules: z.array(
      z.object({
        category: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
        match: z.object({ kind: z.enum(['exact', 'prefix']), value: z.string().min(1) }),
      }),
    ),
    googleSignals: z.object({
      ad_storage: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
      analytics_storage: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
      ad_user_data: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
      ad_personalization: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
    }),
    regionRules: z.array(
      z.object({
        countries: z.array(z.string().regex(new RegExp('^(?:[A-Z]{2}|\\*)$'))),
        mode: z.enum(['opt-in', 'opt-out']),
        respectGpc: z.boolean(),
        gpcCategories: z.array(z.enum(['necessary', 'analytics', 'marketing', 'functional'])),
      }),
    ),
    texts: z.record(
      z.string(),
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        acceptAll: z.string().min(1),
        rejectAll: z.string().min(1),
        save: z.string().min(1),
        preferences: z.string().min(1),
        privacyUrl: z.string().url(),
      }),
    ),
    defaultLanguage: z.string().min(1),
    theme: z.object({
      background: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
      foreground: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
      accent: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
      fontFamily: z.string().min(1),
      position: z.enum(['bottom', 'top', 'center']),
    }),
    behavior: z.object({
      cookieLifetimeDays: z.number().int().gte(1).lte(395),
      repromptOnConfigChange: z.boolean(),
      consentWall: z.boolean(),
    }),
  })
  .refine(
    (value) =>
      ['necessary', 'analytics', 'marketing', 'functional'].every((id) =>
        value.categories.some((category) => category.id === id),
      ),
    'Each category must be present exactly once',
  );
export const BannerConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    projectId: z.string().min(1),
    configHash: z.string().regex(new RegExp('^[a-f0-9]{64}$')),
    categories: z
      .array(
        z
          .object({
            id: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
            services: z.array(
              z
                .object({
                  id: z.string().min(1),
                  name: z.string().min(1),
                  cookiePatterns: z.array(z.string().min(1)),
                })
                .strict(),
            ),
          })
          .strict(),
      )
      .min(4)
      .max(4),
    scriptRules: z.array(
      z
        .object({
          category: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
          match: z.object({ kind: z.enum(['exact', 'prefix']), value: z.string().min(1) }).strict(),
        })
        .strict(),
    ),
    googleSignals: z
      .object({
        ad_storage: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
        analytics_storage: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
        ad_user_data: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
        ad_personalization: z.enum(['necessary', 'analytics', 'marketing', 'functional']),
      })
      .strict(),
    regionRules: z.array(
      z
        .object({
          countries: z.array(z.string().regex(new RegExp('^(?:[A-Z]{2}|\\*)$'))),
          mode: z.enum(['opt-in', 'opt-out']),
          respectGpc: z.boolean(),
          gpcCategories: z.array(z.enum(['necessary', 'analytics', 'marketing', 'functional'])),
        })
        .strict(),
    ),
    texts: z.record(
      z.string(),
      z
        .object({
          title: z.string().min(1),
          description: z.string().min(1),
          acceptAll: z.string().min(1),
          rejectAll: z.string().min(1),
          save: z.string().min(1),
          preferences: z.string().min(1),
          privacyUrl: z.string().url(),
        })
        .strict(),
    ),
    defaultLanguage: z.string().min(1),
    theme: z
      .object({
        background: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
        foreground: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
        accent: z.string().regex(new RegExp('^#[0-9a-fA-F]{6}$')),
        fontFamily: z.string().min(1),
        position: z.enum(['bottom', 'top', 'center']),
      })
      .strict(),
    behavior: z
      .object({
        cookieLifetimeDays: z.number().int().gte(1).lte(395),
        repromptOnConfigChange: z.boolean(),
        consentWall: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .refine(
    (value) =>
      ['necessary', 'analytics', 'marketing', 'functional'].every((id) =>
        value.categories.some((category) => category.id === id),
      ),
    'Each category must be present exactly once',
  );
export const ConsentEventReader = z.object({
  schemaVersion: z.literal(1),
  eventId: z
    .string()
    .regex(new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')),
  projectId: z.string().min(1),
  subjectId: z.string().regex(new RegExp('^[a-zA-Z0-9_-]{16,128}$')),
  configHash: z.string().regex(new RegExp('^[a-f0-9]{64}$')),
  action: z.enum(['accept_all', 'reject_all', 'custom', 'update', 'withdraw']),
  choices: z.object({
    analytics: z.boolean().optional(),
    marketing: z.boolean().optional(),
    functional: z.boolean().optional(),
  }),
  country: z.string().regex(new RegExp('^[A-Z]{2}$')).optional(),
  language: z.string().regex(new RegExp('^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$')),
  gpcDetected: z.boolean(),
  clientTime: z.string().datetime({ offset: true }),
});
export const ConsentEventSchema = z
  .object({
    schemaVersion: z.literal(1),
    eventId: z
      .string()
      .regex(new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')),
    projectId: z.string().min(1),
    subjectId: z.string().regex(new RegExp('^[a-zA-Z0-9_-]{16,128}$')),
    configHash: z.string().regex(new RegExp('^[a-f0-9]{64}$')),
    action: z.enum(['accept_all', 'reject_all', 'custom', 'update', 'withdraw']),
    choices: z
      .object({
        analytics: z.boolean().optional(),
        marketing: z.boolean().optional(),
        functional: z.boolean().optional(),
      })
      .strict(),
    country: z.string().regex(new RegExp('^[A-Z]{2}$')).optional(),
    language: z.string().regex(new RegExp('^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$')),
    gpcDetected: z.boolean(),
    clientTime: z.string().datetime({ offset: true }),
  })
  .strict();
