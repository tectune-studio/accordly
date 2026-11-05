import type { ConsentConfig, Receipt } from '@accordly/core';

export type Release = { id: string; createdAt: string; config: ConsentConfig };

export type Project = {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  draft: ConsentConfig;
  releases: Release[];
  activeRelease: string | null;
};

export type State = {
  mode?: 'live';
  viewer?: { userId: string; role: string };
  organization: { id?: string; name: string; plan: string };
  projects: Project[];
  receipts: (Receipt & { receivedAt: string })[];
  audit: { id: string; action: string; at: string; actor: string; projectId: string }[];
};

export type View =
  | 'Overview'
  | 'Projects'
  | 'Banner Studio'
  | 'Consent records'
  | 'Integrations'
  | 'Billing'
  | 'Settings';

export type DashboardAction = (operation: () => Promise<unknown>, message: string) => Promise<void>;

export type DraftEditor = <K extends keyof ConsentConfig>(key: K, value: ConsentConfig[K]) => void;
