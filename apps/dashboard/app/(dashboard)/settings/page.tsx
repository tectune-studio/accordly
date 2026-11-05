'use client';

import TeamSettings from '@/app/(dashboard)/settings/page';
import { useDashboardContext } from '@/components/dashboard/dashboard-context';

export default function SettingsPage() {
  const { state } = useDashboardContext();
  if (!state) return null;
  return (
    <div className="grid grid-cols-2 gap-6 [@media(max-width:1000px)]:grid-cols-1 [@media(max-width:720px)]:gap-4">
      {state.mode === 'live' && <TeamSettings />}
      <section className="bg-surface border border-line rounded-[10px] min-w-0 p-6.25">
        <h2 className="text-[14px] tracking-[-0.2px] mt-0 mb-5.75 font-semibold mx-0">
          Workspace
        </h2>
        <label className="block text-[11px] text-ink">
          Name
          <input
            className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-canvas text-ink! text-[12px]! mx-0 py-2.5 px-3"
            readOnly
            value={state.organization.name}
          />
        </label>
        <label className="block text-[11px] text-ink">
          Workspace identifier
          <input
            className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-canvas text-ink! text-[12px]! mx-0 py-2.5 px-3"
            readOnly
            value={state.organization.id || 'org_demo'}
          />
        </label>
        <label className="block text-[11px] text-ink">
          Current mode
          <input
            className="block w-full border border-(--line-strong) rounded-[6px] mt-1.5 mb-4.25 bg-canvas text-ink! text-[12px]! mx-0 py-2.5 px-3"
            readOnly
            value={
              state.mode === 'live'
                ? 'Clerk organization · PostgreSQL'
                : 'Local demo · single organization'
            }
          />
        </label>
        <p className="text-muted-foreground mt-3.5 mb-1.5 text-[10px] leading-[1.8] mx-0">
          {state.mode === 'live'
            ? 'Access is checked against current organization membership.'
            : 'Demo mode uses a fixed workspace identity.'}
        </p>
      </section>
      <section className="bg-surface border border-line rounded-[10px] min-w-0 p-6.25">
        <h2 className="text-[14px] tracking-[-0.2px] mt-0 mb-5.75 font-semibold mx-0">
          Environment status
        </h2>
        {[
          [
            'Authentication',
            state.mode === 'live' ? 'Clerk membership verification' : 'Demo owner — no live login',
          ],
          [
            'Storage',
            state.mode === 'live'
              ? 'PostgreSQL with tenant RLS'
              : 'Local JSON · single-process only',
          ],
          ['Payments', 'Simulated · no Stripe requests'],
          ['Configuration delivery', 'Local immutable releases'],
          ['Public deployment', 'Blocked until live adapters exist'],
        ].map(([label, value]) => (
          <div
            className="flex justify-between gap-5 border-b border-line text-[10px] py-3.25 px-0"
            key={label}
          >
            <strong className="font-medium">{label}</strong>
            <span className="text-right text-muted-foreground">{value}</span>
          </div>
        ))}
      </section>
      <section className="bg-surface border border-line rounded-[10px] min-w-0 col-span-full p-6.25">
        <h2 className="text-[14px] tracking-[-0.2px] font-semibold m-0">Workspace activity</h2>
        {!state.audit.length ? (
          <p className="text-muted-foreground text-[12px] my-1.5 mx-0 py-6.25 px-0">
            Publish a banner or create a project to start your audit history.
          </p>
        ) : (
          state.audit.slice(0, 15).map((a) => (
            <div className="flex gap-3 items-center border-b border-line py-3.5 px-0" key={a.id}>
              <span className="w-1.75 h-1.75 rounded-full bg-brand" />
              <div>
                <strong className="text-[11px] font-medium">{a.action}</strong>
                <small className="block text-2.25 text-muted-foreground">
                  {a.actor} · {new Date(a.at).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
