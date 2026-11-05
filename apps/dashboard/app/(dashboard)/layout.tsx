import Dashboard from '../dashboard';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import BrandLogo from '@/components/brand-logo';
import { auth } from '@clerk/nextjs/server';
import { CreateOrganization, OrganizationSwitcher, UserButton } from '@clerk/nextjs';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = process.env.ACCORDLY_MODE === 'demo' ? null : await auth();
  if (session && !session.userId) return session.redirectToSignIn();
  if (session && !session.orgId)
    return (
      <main className="m-auto grid  max-w-[1580px] place-items-center gap-6 px-10.5 pt-8.75 pb-0 min-[1600px]:pt-10.75 [@media(max-width:1200px)]:px-[26px] [@media(max-width:720px)]:px-5 [@media(max-width:720px)]:pt-6.25">
        <BrandLogo />
        <h1 className="mt-0 mb-2.25 font-sans text-[34px] leading-[1.2] font-normal tracking-[-1px] [@media(max-width:1000px)]:text-7.5">
          Welcome to Accordly
        </h1>
        <OrganizationSwitcher hidePersonal />
        <CreateOrganization afterCreateOrganizationUrl="/" />
      </main>
    );
  return (
    <>
      {session && (
        <div>
          <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/" />
          <UserButton />
        </div>
      )}
      <Dashboard
        key={session?.orgId ?? 'demo'}
        sidebar={<DashboardSidebar />}
        header={<DashboardHeader />}
        footer={<DashboardFooter />}
      >
        {children}
      </Dashboard>
    </>
  );
}
