'use client';

import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import { request } from '@/lib/dashboard/api';

export default function BillingPage() {
  const { state, busy, action } = useDashboardContext();
  if (!state) return null;
  return (
    <>
      {state.mode === 'live' && (
        <p className="text-muted-foreground text-[12px] my-1.5 mx-0">
          Live billing is not configured yet.
        </p>
      )}
      {state.mode !== 'live' && (
        <>
          <div className="flex flex-col items-start  bg-(--accent-background) border border-line rounded-2.25 mb-6.25 text-(--brand-hover) [@media(max-width:720px)]:gap-2.5 py-[19px] px-5.5 [@media(max-width:720px)]:p-4">
            <strong className="text-[12px] font-medium [@media(max-width:720px)]:text-[11px]">
              Explore plans in demo mode.
            </strong>
            <p className="text-muted-foreground text-[11px] [@media(max-width:720px)]:text-[10px] my-1.5 mx-0">
              Plan changes are simulated locally. There is no checkout, charge, or live
              subscription.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3.75 mt-8.75 items-stretch [@media(max-width:1200px)]:grid-cols-2 [@media(max-width:1200px)]:gap-[30px_18px] [@media(max-width:720px)]:gap-[35px_12px]">
            {[
              [
                'free',
                'Hosted Free',
                '0',
                'For your first consent experience.',
                '1 production domain',
                '10k managed loads',
                'Hosted configuration',
                'Core consent controls',
              ],
              [
                'starter',
                'Starter',
                '19',
                'For independent sites getting serious.',
                '1 production domain',
                '100k managed loads',
                'Consent records & export',
                'Monthly website scan',
              ],
              [
                'growth',
                'Growth',
                '59',
                'For growing brands and small teams.',
                '5 production domains',
                '500k managed loads',
                'Advanced reports',
                'Scheduled scans & teams',
              ],
              [
                'business',
                'Business',
                '199',
                'For teams building trust at scale.',
                '20 production domains',
                '2M managed loads',
                'Experiments & approvals',
                'API access & longer retention',
              ],
            ].map(([id, title, price, description, ...features]) => (
              <article
                className={
                  id === 'growth'
                    ? 'bg-surface border rounded-b-[10px] min-w-0 relative flex flex-col border-brand shadow-[0_3px_20px_var(--shadow-color)] py-6.25 px-5 [@media(max-width:720px)]:py-5 [@media(max-width:720px)]:px-[15px]'
                    : 'bg-surface border border-line rounded-[10px] min-w-0 relative flex flex-col py-6.25 px-5 [@media(max-width:720px)]:py-5 [@media(max-width:720px)]:px-[15px]'
                }
                key={id}
              >
                {id === 'growth' && (
                  <div className="absolute top-[-20px] left-[-1px] right-[-1px] bg-brand text-(--on-brand) text-center rounded-[7px_7px_0_0] text-[8px] tracking-[1px] p-1">
                    ROOM TO GROW
                  </div>
                )}
                <h3 className="font-sans font-normal text-[24px] mt-0 mb-1.75 [@media(max-width:720px)]:text-[23px] mx-0">
                  {title}
                </h3>
                <p className="text-muted-foreground text-[10px] min-h-8.75 my-1.5 mx-0">
                  {description}
                </p>
                <div className="text-[32px] tracking-[-1px] my-5 mx-0">
                  ${price}
                  <span className="text-[9px] text-muted-foreground tracking-[0] ml-1.25">
                    / month
                  </span>
                </div>
                <ul className="border-t border-line list-none flex-1 m-0 py-[15px] px-0">
                  {features.map((f) => (
                    <li
                      className="flex gap-2 text-(--brand-hover) text-[10px] [@media(max-width:720px)]:text-[9px] my-3 mx-0"
                      key={f}
                    >
                      ✓ <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={busy || state.organization.plan === id}
                  className={
                    id === 'growth'
                      ? 'inline-flex items-center justify-center gap-2.25 min-h-10 border rounded-1.75 bg-brand text-[9px]! font-semibold! whitespace-nowrap border-brand text-(--on-brand)! shadow-[0_2px_3px_var(--shadow-color)] [@media(max-width:720px)]:text-[8px]! enabled:hover:bg-(--brand-hover) enabled:hover:border-(--brand-hover) enabled:hover:filter-none! py-2.5 px-1.75 motion-reduce:transition-none!'
                      : 'inline-flex items-center justify-center gap-2.25 min-h-10 border border-line rounded-1.75 bg-surface text-[9px]! font-semibold! whitespace-nowrap [@media(max-width:720px)]:text-[8px]! py-2.5 px-1.75 motion-reduce:transition-none!'
                  }
                  onClick={() =>
                    action(
                      () => request('billing', { plan: id }),
                      'Demo plan changed. No payment was taken.',
                    )
                  }
                >
                  {state.organization.plan === id
                    ? 'Current demo plan'
                    : 'Try ' + title + ' in demo'}
                </button>
              </article>
            ))}
          </div>
          <p className="text-muted-foreground mt-3.5 mb-1.5 text-[10px] leading-[1.8] mx-0">
            Proposed product packaging. Limits and premium features are not implemented or enforced
            in this demo. Open-source core remains free to self-host.
          </p>
        </>
      )}
    </>
  );
}
