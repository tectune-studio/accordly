'use client';

import type { CSSProperties, ReactNode } from 'react';
import { DashboardContext } from '@/components/dashboard/dashboard-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';

import { LoadingState } from '@/components/dashboard/loading-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Toast } from '@/components/dashboard/toast';

import { useDashboard } from '@/hooks/use-dashboard';

export default function Dashboard({
  children,
  sidebar,
  header,
  footer,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}) {
  const dashboard = useDashboard();
  const { state, view } = dashboard;

  return (
    <DashboardContext.Provider value={dashboard}>
      <SidebarProvider
        className="flex min-h-svh w-full"
        style={{ '--sidebar-width': '238px', '--sidebar-width-icon': '64px' } as CSSProperties}
      >
        {sidebar}
        <div className="flex min-h-svh min-w-0 flex-1 flex-col ml-0" inert={dashboard.modal}>
          {header}
          <main className="w-full max-w-[1580px] flex-1 pt-8.75 pb-0 min-[1600px]:pt-10.75 [@media(max-width:720px)]:pt-6.25 [@media(max-width:720px)]:pb-0 mx-auto px-10.5 [@media(max-width:1200px)]:px-[26px] [@media(max-width:720px)]:px-5">
            {dashboard.error && (
              <div
                className="border border-(--error-border) font-semibold bg-(--error-background) rounded-[8px] mb-5 text-(--error-foreground) flex items-center justify-between text-[12px] py-3.5 px-4.25"
                role="alert"
              >
                {dashboard.error}
                <button
                  className="border-0 bg-transparent text-inherit! text-[20px]! motion-reduce:transition-none!"
                  aria-label="Dismiss error"
                  onClick={() => dashboard.setError('')}
                >
                  ×
                </button>
              </div>
            )}
            {!state ? (
              <LoadingState
                onRetry={() =>
                  dashboard.reload().catch((error) => dashboard.setError(error.message))
                }
              />
            ) : (
              <>
                <PageHeading
                  view={view}
                  busy={dashboard.busy}
                  onCreateProject={dashboard.openCreateProject}
                  onPublish={dashboard.publish}
                />
                {children}
              </>
            )}
          </main>
          <div className="mx-auto w-full max-w-[1580px] shrink-0 px-10.5 [@media(max-width:1200px)]:px-[26px] [@media(max-width:720px)]:px-5">
            {footer}
          </div>
        </div>
        {dashboard.toast && <Toast message={dashboard.toast} onDismiss={dashboard.dismissToast} />}
        {dashboard.modal && (
          <CreateProjectDialog
            busy={dashboard.busy}
            error={dashboard.error}
            onClose={dashboard.closeCreateProject}
            onSubmit={dashboard.createProject}
          />
        )}
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}
