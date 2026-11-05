'use client';

import Link from 'next/link';
import BrandLogo from '@/components/brand-logo';
import { cn } from '@/lib/utils';
import type { View } from '@/lib/dashboard/types';
import { useDashboardContext } from './dashboard-context';
import { navigation, viewPaths } from '@/lib/dashboard/navigation';
import { Icon } from './icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

export function DashboardSidebar() {
  const { state, view, modal: inert } = useDashboardContext();
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && sidebarState === 'collapsed';

  function menu(items: View[]) {
    return (
      <SidebarMenu className="gap-0">
        {items.map((item) => (
          <SidebarMenuItem key={item}>
            <SidebarMenuButton
              asChild
              className={cn(
                'mb-1.25 flex h-auto min-h-10.75 w-full items-center gap-2.75 rounded-1.75 border-0 bg-transparent px-3.5 py-3 text-left! text-[12px]! text-muted-foreground! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground! data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold! data-[active=true]:text-sidebar-accent-foreground! group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:min-h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! motion-reduce:transition-none!',
                item === 'Projects' && 'pr-10.5',
              )}
              isActive={view === item}
              aria-current={view === item ? 'page' : undefined}
              aria-label={item}
              tooltip={item}
              onClick={() => setOpenMobile(false)}
            >
              <Link href={viewPaths[item]}>
                <Icon name={item} />
                <span className="group-data-[collapsible=icon]:hidden">{item}</span>
              </Link>
            </SidebarMenuButton>
            {item === 'Projects' && (
              <SidebarMenuBadge className="top-3! right-3.5 h-4.75 min-w-0 rounded-lg bg-(--accent-background) px-1.25 py-0 text-[10px] group-data-[collapsible=icon]:hidden">
                {state?.projects.length || 0}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border" inert={inert}>
      <SidebarHeader className="shrink-0 gap-0 px-4.5 pt-7.25 pb-0 group-data-[collapsible=icon]:px-3">
        <Link
          className="flex items-center px-2.25 py-0 text-6.25 font-bold tracking-[-1.2px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          href="/"
          aria-label="Accordly home"
          onClick={() => setOpenMobile(false)}
        >
          <BrandLogo collapsed={collapsed} />
        </Link>
        <div
          className="mt-8 flex w-full items-center gap-2.5 rounded-2.25 border border-line bg-sidebar p-2.75 text-left group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
          title={state?.organization.name || 'Acme Studio'}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-line bg-(--accent-background) font-sans text-[19px]">
            A
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-[12px]">
              {state?.organization.name || 'Acme Studio'}
            </strong>
            <small className="block text-[10px] text-muted-foreground">Workspace</small>
          </div>
          <span
            className="ml-auto text-[10px] leading-2 text-muted-foreground group-data-[collapsible=icon]:hidden"
            aria-hidden="true"
          >
            ⌃<br />⌄
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-[1_0_auto] gap-0 overflow-visible px-4.5 py-0 group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:pt-6">
        <nav className="block" id="workspace-navigation" aria-label="Workspace navigation">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="mx-3.5 mt-7.5 mb-3 h-auto p-0 text-2.25 font-semibold tracking-[1.5px] text-muted-foreground group-data-[collapsible=icon]:hidden">
              WORKSPACE
            </SidebarGroupLabel>
            <SidebarGroupContent>{menu(navigation)}</SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter className="mt-auto shrink-0 gap-0 px-4.5 pt-6 pb-0 group-data-[collapsible=icon]:px-3">
        <nav aria-label="Workspace settings">{menu(['Billing', 'Settings'])}</nav>
        <a
          href="https://github.com/tectune-studio/accordly"
          target="_blank"
          rel="noreferrer"
          className="flex group items-start flex-col gap-2 mx-1.25 my-2 rounded-[10px] border border-line bg-[linear-gradient(120deg,var(--canvas),var(--accent-background))] p-4.25 group-data-[collapsible=icon]:hidden"
        >
          <strong className="block  font-sans text-lg leading-tight font-normal">
            Built for trust.
            <br />
            Open by design.
          </strong>
          <span className="flex items-center gap-1 text-[10px] ">
            Check out source{' '}
            <ArrowRight
              size={12}
              className="text-[10px] group-hover:translate-x-1 transition-transform"
            />
          </span>
        </a>
        <div
          className="mt-[15px] flex items-center gap-2.5 border-t border-line px-2 py-4.75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
          title={state?.mode === 'live' ? state.viewer?.role : 'Demo owner'}
        >
          <span className="grid size-8.5 shrink-0 place-items-center rounded-full border-3 border-line bg-(--accent-background) text-[10px] font-semibold text-(--brand-hover) shadow-[0_0_0_1px_var(--line)]">
            JD
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <strong className="block text-[12px]">
              {state?.mode === 'live' ? state.viewer?.role : 'Demo owner'}
            </strong>
            <small className="block text-[10px] text-muted-foreground">
              {state?.mode === 'live' ? 'Organization workspace' : 'Local workspace'}
            </small>
          </div>
          <span className="ml-auto size-1.5 rounded-full bg-brand group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
