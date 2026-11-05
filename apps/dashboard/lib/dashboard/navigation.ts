import type { View } from './types';

export const viewPaths: Record<View, string> = {
  Overview: '/',
  Projects: '/projects',
  'Banner Studio': '/banner-studio',
  'Consent records': '/consent-records',
  Integrations: '/integrations',
  Billing: '/billing',
  Settings: '/settings',
};

export function viewFromPathname(pathname: string): View {
  return (
    (Object.keys(viewPaths) as View[]).find((view) => viewPaths[view] === pathname) ?? 'Overview'
  );
}

export const navigation: View[] = [
  'Overview',
  'Projects',
  'Banner Studio',
  'Consent records',
  'Integrations',
];
