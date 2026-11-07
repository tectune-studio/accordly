'use client';

import { Badge } from '@/components/dashboard/status-badge';
import { cn } from 'cn';
import { InfoIcon } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <>
      <div className="flex gap-3.25 bg-(--accent-background) border border-line rounded-2.25 mb-6.25 text-(--brand-hover) [@media(max-width:720px)]:gap-2.5 py-[19px] px-5.5 [@media(max-width:720px)]:p-4">
        <InfoIcon size={23} className="text-[23px] leading-[1]" />
        <div>
          <strong className="text-[12px] font-medium [@media(max-width:720px)]:text-[11px]">
            Your core works without a single third-party service.
          </strong>
          <p className="text-muted-foreground text-[11px] [@media(max-width:720px)]:text-[10px] my-1.5 mx-0">
            Dummy service variables are configured for development. Only the local demo and
            open-source SDK run today.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4.5 [@media(max-width:1000px)]:grid-cols-2 [@media(max-width:720px)]:gap-3">
        {[
          [
            'G',
            'Google Consent Mode',
            'Map analytics and marketing choices to Google’s four consent signals.',
            'SDK adapter available',
            'bg-(--accent-background)',
          ],
          [
            'N',
            'Next.js / React',
            'Connect your app with a provider, preference hooks, and explicit gates.',
            'Source adapter available',
            'bg-(--muted-background)',
          ],
          [
            'W',
            'WordPress',
            'Guided CMS installation and tag management.',
            'Planned',
            'bg-(--accent-background)',
          ],
          [
            'S',
            'Shopify',
            'Platform-specific privacy API and storefront integration.',
            'Planned',
            'bg-(--accent-background)',
          ],
          [
            'C',
            'Clerk',
            'Organization authentication for the hosted control plane.',
            'Dummy configuration',
            'bg-(--accent-strong)',
          ],
          [
            'S',
            'Stripe',
            'Subscription checkout, invoices, and billing portal.',
            'Dummy configuration',
            'bg-(--accent-strong)',
          ],
          [
            '☁',
            'Cloudflare',
            'R2 releases, edge delivery, and queued consent ingestion.',
            'Deployment scaffold',
            'bg-(--accent-background)',
          ],
          [
            'P',
            'PostgreSQL',
            'Tenant-isolated data, releases, receipts, and audit history.',
            'Schema scaffold',
            'bg-(--muted-background)',
          ],
        ].map(([letter, title, description, status, background]) => (
          <article
            className="bg-surface border border-line rounded-[10px] min-w-0 flex flex-col items-start p-[23px] [@media(max-width:720px)]:p-[19px]"
            key={title}
          >
            <div
              data-testid="integration-logo"
              className={cn(
                'grid size-10 place-items-center rounded-[10px] text-[23px] font-bold text-(--brand-hover)',
                background,
              )}
            >
              {letter}
            </div>
            <h3 className="text-3.25 mt-4.25 mb-1.5 [@media(max-width:720px)]:text-[12px] mx-0">
              {title}
            </h3>
            <p className="text-muted-foreground mt-1.5 mb-4.5 text-[11px] leading-[1.8] flex-1 [@media(max-width:720px)]:text-[10px] mx-0">
              {description}
            </p>
            <Badge
              className="[@media(max-width:720px)]:text-[8px]"
              tone={status.includes('available') ? 'green' : 'gray'}
            >
              {status}
            </Badge>
          </article>
        ))}
      </div>
      <section className="bg-surface border border-line rounded-[10px] min-w-0 mt-6 p-6.25">
        <h2 className="text-[14px] tracking-[-0.2px] font-semibold m-0">
          Explicit consent. Explicit integrations.
        </h2>
        <p className="text-muted-foreground text-[11px] my-1.5 mx-0">
          Initialize consent before vendor SDKs and stop future processing when permission is
          withdrawn.
        </p>
        <pre className="bg-(--inverse-background) text-(--inverse-foreground) border border-(--brand-hover) rounded-[8px] text-[10px] leading-[1.8] overflow-auto max-h-none whitespace-pre mt-5 p-4">{`const cmp = createConsentManager({ config }).initialize();\n\nconst release = cmp.gate('analytics',\n  () => analytics.start(),\n  () => analytics.stop()\n);\n\n// Give visitors a persistent way to change their mind.\npreferencesButton.onclick = () => cmp.showPreferences();`}</pre>
      </section>
    </>
  );
}
