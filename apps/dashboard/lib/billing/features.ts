// Feature matrix mapping for the detailed comparison table at the bottom.
// Values array maps sequentially to your `plans` array:
// [Free, Starter, Pro, Business, Agency, Enterprise]
export const FEATURE_MATRIX = [
  {
    feature: 'Domains',
    description: 'The number of website domains you can manage in your workspace.',
    values: ['1 domain', '1 domain', '3 domains', '10 domains', 'Unlimited projects', 'Custom'],
  },
  {
    feature: 'Monthly visitors',
    description: 'Billed by the number of monthly unique visitors who load your consent script.',
    values: ['2,000', '25,000', '150,000', '750,000', 'Custom', 'Custom'],
  },
  {
    feature: 'Consent logs',
    description: 'The retention period for keeping a secure log of user consent records.',
    values: ['30-day logs', '12-month logs', '12-month logs', '12-month logs', '12-month logs', 'Custom'],
  },
  {
    feature: 'A/B testing',
    description: 'Test different banner variations to optimize opt-in rates (Version 1.1 roadmap).',
    values: [false, false, true, true, true, true],
  },
  {
    feature: 'Analytics connectors',
    description: 'Direct integrations with third-party analytics platforms (Version 1.1 roadmap).',
    values: [false, false, true, true, true, true],
  },
  {
    feature: 'API access',
    description: 'Bulk API access for programmatic management and custom workflows (Version 1.2 roadmap).',
    values: [false, false, false, true, true, true],
  },
  {
    feature: 'Team seats',
    description: 'Invite additional team members to collaborate and manage the consent workspace.',
    values: [false, false, false, true, true, true],
  },
  {
    feature: 'White-label',
    description: 'Agency multi-tenant workspace with white-label branding capabilities (Version 1.2 roadmap).',
    values: [false, false, false, false, true, true],
  },
  {
    feature: 'SSO & SLA',
    description: 'Single Sign-On access and guaranteed Service Level Agreements for enterprise.',
    values: [false, false, false, false, false, true],
  },
  {
    feature: 'EU data residency',
    description: 'Option to host and process all consent data exclusively within the European Union.',
    values: [false, false, false, false, false, true],
  },
  {
    feature: 'Mobile SDKs',
    description: 'Native iOS and Android SDKs with cross-platform consent sharing (Version 3 roadmap).',
    values: [false, false, false, false, false, true],
  },
];
