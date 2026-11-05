'use client';

import { OrganizationSwitcher, UserButton, useUser } from '@clerk/nextjs';

export function LiveUserAccount({ sidebar = false }: { sidebar?: boolean }) {
  const { user, isLoaded } = useUser();
  const name =
    user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Your account';
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <UserButton
        appearance={{
          elements: {
            avatarBox: sidebar ? 'size-8.5' : 'size-8',
            userButtonTrigger:
              'shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2',
          },
        }}
      />
      {sidebar && (
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <strong className="block truncate text-[12px]">
            {isLoaded ? name : 'Loading account…'}
          </strong>
          <small className="block truncate text-[10px] text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress || 'Your account'}
          </small>
        </div>
      )}
    </div>
  );
}

export function LiveOrganizationMenu({ collapsed }: { collapsed: boolean }) {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/"
      afterCreateOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: 'w-full min-w-0',
          organizationSwitcherTrigger:
            'flex w-full min-w-0 justify-between rounded-lg border border-line bg-sidebar p-2.75 hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2',
          organizationPreview: 'min-w-0',
          organizationPreviewTextContainer: collapsed ? 'hidden' : 'min-w-0',
          organizationPreviewMainIdentifier: 'truncate text-[12px]',
          organizationSwitcherTriggerIcon: collapsed ? 'hidden' : 'shrink-0',
        },
      }}
    />
  );
}
