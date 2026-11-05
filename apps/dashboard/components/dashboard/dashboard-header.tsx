'use client';

import { useDashboardContext } from './dashboard-context';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function DashboardHeader() {
  const { state, view } = useDashboardContext();
  return (
    <header className="h-[74px] border-b border-line bg-(--surface-glass) flex items-center justify-between text-[11px] [@media(max-width:720px)]:h-[51px] py-0 px-10.5 [@media(max-width:1200px)]:px-[26px] [@media(max-width:720px)]:py-0 [@media(max-width:720px)]:px-5">
      <div className="flex items-center gap-3.5 min-w-0 [@media(max-width:720px)]:gap-2">
        <SidebarTrigger
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-1.75 border-0 bg-transparent p-0 text-ink! hover:bg-sidebar-accent motion-reduce:transition-none!"
          aria-controls="workspace-navigation"
          title="Toggle sidebar (Ctrl/⌘+B)"
        />
        <div className="flex gap-3.5 text-muted-foreground [@media(max-width:720px)]:text-[10px]">
          Workspace <span className="text-muted-foreground">/</span>{' '}
          <strong className="font-medium text-ink">{view}</strong>
        </div>
      </div>
      <div className="flex items-center gap-5.5 text-muted-foreground [@media(max-width:1000px)]:gap-3 [@media(max-width:720px)]:gap-2">
        <span className="text-[8px] tracking-[1px] border border-line rounded-[4px] bg-(--accent-background) text-(--brand-hover) [@media(max-width:1000px)]:hidden py-1 px-1.75">
          {state?.mode === 'live' ? 'ACCORDLY' : 'DEMO WORKSPACE'}
        </span>

        <a
          className="text-[11px] [@media(max-width:1000px)]:text-[10px] [@media(max-width:720px)]:text-[10px]"
          href="https://github.com/tectune-studio/accordly#readme"
          target="_blank"
          rel="noreferrer"
        >
          Documentation ↗
        </a>
        <span className="w-[29px] h-[29px] rounded-full bg-(--accent-background) text-(--brand-hover) grid place-items-center text-2.25 font-semibold border-3 border-line shadow-[0_0_0_1px_var(--line)] [@media(max-width:720px)]:hidden">
          JD
        </span>
      </div>
    </header>
  );
}
