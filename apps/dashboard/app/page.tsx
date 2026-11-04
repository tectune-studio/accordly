import Dashboard from './dashboard';
export const dynamic = 'force-dynamic';
export default function Page() {
  if (process.env.CONSENTKIT_MODE !== 'demo')
    return (
      <main className="setup-required">
        <h1>Production setup required</h1>
        <p>
          Live authentication and storage adapters must be implemented before this dashboard can be
          deployed publicly. Use CONSENTKIT_MODE=demo for local development.
        </p>
      </main>
    );
  return <Dashboard />;
}
