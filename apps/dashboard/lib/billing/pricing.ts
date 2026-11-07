// Feature matrix for the plan comparison table at the bottom of the pricing page.
// Each `values` array maps in order to `plans`: [Starter, Pro, Business, Agency].
// Features marked "Coming soon" are not live yet. See the notes in the hand-off.
export const FEATURE_MATRIX = [
  {
    feature: 'Domains',
    description: 'How many websites you can manage in one workspace.',
    values: ['1 domain', '3 domains', '10 domains', 'Custom'],
  },
  {
    feature: 'Monthly visitors',
    description:
      'Unique visitors per month who load your consent banner. Each plan is sized by this number.',
    values: ['25,000', '150,000', '750,000', 'Custom'],
  },
  {
    feature: 'Consent logs',
    description: 'How long we keep consent records, so you can show proof of consent.',
    values: ['12 months', '24 months', '36 months', 'Custom'],
  },
  {
    feature: 'A/B testing',
    description: 'Test banner variations to find the one with the best opt-in rate. Coming soon.',
    values: [false, true, true, true],
  },
  {
    feature: 'Analytics connectors',
    description: 'Connect consent choices to your analytics platforms. Coming soon.',
    values: [false, true, true, true],
  },
  {
    feature: 'API access',
    description: 'Manage banners and consent data programmatically. Coming soon.',
    values: [false, false, true, true],
  },
  {
    feature: 'Team seats',
    description: 'Invite teammates and assign roles to manage consent together.',
    values: [false, false, true, true],
  },
  {
    feature: 'White-label',
    description:
      'Run Accordly under your own brand in a multi-tenant agency workspace. Coming soon.',
    values: [false, false, false, true],
  },
];

// Removed from the table because no plan includes them yet. Add them back as
// rows once a plan ships them (or show them in a separate "On the roadmap" list):
//   SSO & SLA        - single sign-on and a guaranteed service level
//   EU data residency - store and process consent data only in the EU
//   Mobile SDKs      - native iOS and Android SDKs

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For a single site getting started with consent.',
    badge: null,
    cta: 'Get started',
    includes: null,
    monthly: 12,
    annual: 120,
    domains: 1,
    muv: 25000,
    retention: '12-month consent logs',
    features: [
      'Visual banner editor',
      '5 languages',
      'Basic consent statistics',
      'Monthly cookie scans',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams managing consent across several sites.',
    badge: null,
    cta: 'Get started',
    includes: 'Starter',
    monthly: 49,
    annual: 490,
    domains: 3,
    muv: 150000,
    retention: '24-month consent logs',
    features: [
      'A/B testing',
      'Consent wall',
      'Analytics connectors',
      '25 languages',
      'Weekly cookie scans',
      'Webhooks',
      'Remove Accordly branding',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For larger teams that need more traffic, more sites, and more control.',
    badge: 'Recommended',
    cta: 'Get started',
    includes: 'Pro',
    monthly: 149,
    annual: 1490,
    domains: 10,
    muv: 750000,
    retention: '36-month consent logs',
    features: [
      'Subdomain support',
      'API access',
      'Team seats and roles',
      'Audit log',
      'Cross-domain consent',
      'Priority support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies managing consent across client sites.',
    badge: null,
    cta: 'Contact us',
    includes: 'Business',
    monthly: 199,
    annual: null,
    domains: null,
    muv: null,
    retention: 'Custom consent log retention',
    features: [
      'Unlimited client projects',
      'Multi-tenant workspace',
      'Client access',
      'White-label branding',
      'Bulk-edit API',
      'Lower rates as you add projects',
    ],
  },
] as const;

export type PlanId = (typeof PLANS)[number]['id'];

export function findPlan(id: string) {
  // 'growth' is a legacy plan id that now maps to Pro.
  return PLANS.find((plan) => plan.id === (id === 'growth' ? 'pro' : id));
}
