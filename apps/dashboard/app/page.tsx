import Dashboard from './dashboard';
import { auth } from '@clerk/nextjs/server';
import { CreateOrganization, OrganizationSwitcher, UserButton } from '@clerk/nextjs';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (process.env.CONSENTKIT_MODE === 'demo') return <Dashboard />;
  const session = await auth();
  if (!session.userId) return session.redirectToSignIn();
  if (!session.orgId)
    return (
      <main className="grid min-h-screen place-items-center gap-6">
        <h1>Welcome to Accordly</h1>
        <OrganizationSwitcher hidePersonal />
        <CreateOrganization afterCreateOrganizationUrl="/" />
      </main>
    );
  return (
    <>
      <div className="live-account-bar">
        <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/" />
        <UserButton />
      </div>
      <Dashboard />
    </>
  );
}
