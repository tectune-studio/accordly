'use client';

import type { Project } from '@/lib/dashboard/types';
import { Badge } from './status-badge';

export function ProjectCard({
  project: p,
  receipts,
  onOpen,
}: {
  project: Project;
  receipts: number;
  onOpen: () => void;
}) {
  return (
    <article className="bg-surface border border-line rounded-[10px] min-w-0 pt-5 pb-0 min-[1600px]:min-h-[230px] [@media(max-width:720px)]:pt-[15px] [@media(max-width:720px)]:pb-0 px-5 [@media(max-width:720px)]:px-[15px]">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-(--accent-background) text-(--brand-hover) grid place-items-center font-sans text-[20px] rounded-2.25 border border-line [@media(max-width:720px)]:w-7.5 [@media(max-width:720px)]:h-7.5 [@media(max-width:720px)]:text-4.25">
          {p.name.charAt(0).toUpperCase()}
        </div>
        <Badge
          className="[@media(max-width:720px)]:px-1.25 [@media(max-width:720px)]:py-[3px] [@media(max-width:720px)]:text-[8px]"
          tone={p.activeRelease ? 'green' : 'orange'}
        >
          {p.activeRelease ? 'Published' : 'Draft'}
        </Badge>
      </div>
      <h3 className="text-3.25 mt-4 mb-1.25 font-semibold [@media(max-width:720px)]:text-[12px] mx-0">
        {p.name}
      </h3>
      <p className="text-muted-foreground text-[10px] my-1.5 mx-0">⌁ {p.domain}</p>
      <div className="text-2.25 text-muted-foreground flex justify-between my-[19px] mx-0">
        <span>
          <strong className="font-medium text-ink">{receipts}</strong> decisions
        </span>
        <span>{p.releases.length} versions</span>
      </div>
      <button
        className="flex justify-between w-full border-0 border-t border-line bg-transparent text-[10px]! text-(--brand-hover)! py-3.25 px-0 motion-reduce:transition-none!"
        onClick={onOpen}
      >
        Manage project <span>↗</span>
      </button>
    </article>
  );
}
