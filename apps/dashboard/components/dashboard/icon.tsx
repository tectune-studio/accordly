import type { ReactNode } from 'react';

const paths: Record<string, ReactNode> = {
  Overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  Projects: (
    <>
      <path d="M3 7h7l2 2h9v11H3z" />
      <path d="M3 7V4h7l2 3" />
    </>
  ),
  'Banner Studio': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 13h8M8 16h5" />
    </>
  ),
  'Consent records': (
    <>
      <path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4" />
    </>
  ),
  Integrations: (
    <>
      <path d="M8 3v5M16 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v4" />
    </>
  ),
  Billing: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  Settings: (
    <>
      <path d="m12 3 2 3 4-1 1 4 3 3-3 2 1 4-4 1-4 3-2-3-4 1-1-4-3-2 3-3-1-4 4 1z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};
export function Icon({ name, size = 19 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || <path d="M5 12h14m-6-6 6 6-6 6" />}
    </svg>
  );
}
