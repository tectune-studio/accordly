'use client';

import type { View } from '@/lib/dashboard/types';
import { ArrowDownToLine, Globe, Plus } from 'lucide-react';

export function PageHeading({
  view,
  busy,
  onCreateProject,
  onPublish,
}: {
  view: View;
  busy: boolean;
  onCreateProject: () => void;
  onPublish: () => Promise<void>;
}) {
  return (
    <div className="flex mb-7.5 [@media(max-width:1000px)]:items-start [@media(max-width:720px)]:mb-5.75 [@media(max-width:720px)]:gap-3.75 items-center justify-between gap-5">
      <div>
        {/*<div className="text-[8px] tracking-[1.7px] font-bold text-muted-foreground mb-2.5 [@media(max-width:720px)]:text-1.75">
          YOUR PRIVACY WORKSPACE
        </div>*/}
        <h1 className="font-sans text-[34px] font-normal tracking-[-1px] leading-[1.2] mt-0 mb-2.25 [@media(max-width:1000px)]:text-7.5 [@media(max-width:720px)]:text-[27px] mx-0">
          {view === 'Overview' ? 'Good things start with trust.' : view}
        </h1>
        <p className="text-muted-foreground text-[12px] [@media(max-width:720px)]:text-[10px] [@media(max-width:720px)]:max-w-[230px] my-1.5 mx-0">
          {
            {
              Overview: 'A clear view of your consent experience. All in one place.',
              Projects: 'A thoughtful consent experience for every website.',
              'Banner Studio': 'Make privacy feel like part of your brand.',
              'Consent records': 'Every choice matters. Here’s the record.',
              Integrations: 'Connect your tools. Keep consent in control.',
              Billing: 'A plan that grows with your ambition.',
              Settings: 'The foundation of your workspace.',
            }[view]
          }
        </p>
      </div>
      {['Overview', 'Projects'].includes(view) && (
        <button
          className="inline-flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-brand text-[11px]! font-semibold! whitespace-nowrap border-brand text-(--on-brand)! shadow-[0_2px_3px_var(--shadow-color)] [@media(max-width:720px)]:text-2.25! [@media(max-width:720px)]:min-h-[34px] enabled:hover:bg-(--brand-hover) enabled:hover:border-(--brand-hover) enabled:hover:filter-none! py-2.5 px-4 [@media(max-width:720px)]:py-2 [@media(max-width:720px)]:px-2.5 motion-reduce:transition-none!"
          onClick={onCreateProject}
        >
          <Plus size={15} />
          <span>Create project</span>
        </button>
      )}
      {view === 'Consent records' && (
        <a
          className="inline-flex items-center justify-center gap-2.25 min-h-10 border border-line rounded-1.75 bg-surface text-[11px] font-semibold whitespace-nowrap [@media(max-width:720px)]:text-2.25 [@media(max-width:720px)]:min-h-[34px] py-2.5 px-4 [@media(max-width:720px)]:py-2 [@media(max-width:720px)]:px-2.5"
          href="/api/export"
        >
          <ArrowDownToLine size={15} className="text-ink" />
          <span className="text-ink">Export JSON</span>
        </a>
      )}
      {view === 'Banner Studio' && (
        <button
          className="inline-flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-brand text-[11px]! font-semibold! whitespace-nowrap border-brand text-(--on-brand)! shadow-[0_2px_3px_var(--shadow-color)] [@media(max-width:720px)]:text-2.25! [@media(max-width:720px)]:min-h-[34px] enabled:hover:bg-(--brand-hover) enabled:hover:border-(--brand-hover) enabled:hover:filter-none! py-2.5 px-4 [@media(max-width:720px)]:py-2 [@media(max-width:720px)]:px-2.5 motion-reduce:transition-none!"
          disabled={busy}
          onClick={onPublish}
        >
          <Globe size={15} />
          <span> Publish Banner</span>
        </button>
      )}
    </div>
  );
}
