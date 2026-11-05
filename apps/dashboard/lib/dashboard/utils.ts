import type { Project, State } from './types';

export const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const human = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function getConsentStats(state: State | null) {
  return {
    total: state?.receipts.length || 0,
    accepted: state?.receipts.filter((receipt) => receipt.action === 'accept').length || 0,
    rejected: state?.receipts.filter((receipt) => receipt.action === 'reject').length || 0,
    customized: state?.receipts.filter((receipt) => receipt.action === 'customize').length || 0,
    active: state?.projects.filter((project) => project.activeRelease).length || 0,
  };
}

export function buildInstallSnippet(project: Project | undefined, origin: string) {
  return project
    ? `<script type="module">\n  import { createConsentManager } from '${origin}/api/sdk/0.2.0/consent.js';\n  const config = await fetch('${origin}/api/public/${project.id}/current').then(r => r.json());\n  const cmp = createConsentManager({ config }).initialize();\n  // Gate optional integrations with cmp.gate() before loading them.\n  if (!cmp.hasDecision()) cmp.showPreferences();\n</script>`
    : '';
}
