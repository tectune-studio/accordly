import type { Metadata } from 'next';

const title = 'Accordly — Open-source cookie consent management';
const description =
  'Open-source cookie consent management with customizable banners, granular preferences, script gating, Google Consent Mode v2 and regional GPC handling.';

// No public website origin is documented in the existing app configuration.
// Keep canonical, social URLs and absolute entity IDs unset rather than infer
// them from a deployment hostname, request header or delivery-service origin.
export const landingMetadata: Metadata = {
  title,
  description,
  keywords: [
    'Accordly',
    'open source cookie consent',
    'consent management platform',
    'cookie consent banner',
    'consent preferences',
    'GDPR consent management',
    'ePrivacy cookie consent',
    'CCPA privacy choices',
    'CPRA privacy choices',
    'Google Consent Mode v2',
    'Global Privacy Control',
    'GPC',
    'script blocking',
    'React consent management',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Accordly',
    locale: 'en_US',
    title,
    description,
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export const landingStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': '#website',
      name: 'Accordly',
      description,
      inLanguage: 'en',
      about: { '@id': '#software' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': '#software',
      name: 'Accordly',
      description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      featureList: [
        'Customizable cookie consent banners and a reopenable preference center',
        'Accept, reject, customize and withdraw consent',
        'Purpose-based gating for site-owned scripts and iframes',
        'Google Consent Mode v2 default and update signals',
        'Regional Global Privacy Control (GPC) handling',
        'First-party consent storage and versioned configurations',
        'Framework-independent consent core and React integration',
      ],
    },
  ],
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
