'use client';
import { useState } from 'react';
import { useDashboardContext } from '@/components/dashboard/dashboard-context';
import { request } from '@/lib/dashboard/api';
import { plans, findPlan } from '@/lib/billing/plans';

export default function BillingPage() {
  const { state, busy, action } = useDashboardContext();
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  if (!state) return null;
  const live = state.mode === 'live';
  const current = findPlan(state.organization.plan);
  return (
    <>
      <div className="rounded-xl border border-line bg-surface p-5 mb-6">
        <h2 className="text-lg font-semibold">
          Your plan: {current?.name || state.organization.plan}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Usage is measured in monthly unique visitors (MUV) who load your consent script. Page
          navigation does not create another unique visitor.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {live
            ? 'Paid subscriptions are not available yet. These plans preview our proposed offering.'
            : 'Explore plans in demo mode. Plan changes are simulated locally; no payment is taken.'}
        </p>
      </div>
      <div
        className="flex flex-wrap items-center gap-3 mb-6"
        role="group"
        aria-label="Billing interval"
      >
        {(['monthly', 'annual'] as const).map((value) => (
          <button
            key={value}
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
            className={`rounded-lg border px-4 py-2 ${interval === value ? 'bg-brand text-white border-brand' : 'border-line bg-surface'}`}
          >
            {value === 'monthly' ? 'Monthly' : 'Annual — 2 months free'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const selected = current?.id === plan.id;
          const quoted = plan.id === 'agency' || plan.id === 'enterprise';
          const price = plan[interval];
          return (
            <article
              key={plan.id}
              className={`flex min-w-0 flex-col rounded-xl border bg-surface p-6 ${plan.id === 'pro' ? 'border-brand' : 'border-line'}`}
            >
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className="my-5 text-3xl font-semibold">
                {plan.id === 'agency'
                  ? 'From $199'
                  : price === null
                    ? 'Custom'
                    : `$${price.toLocaleString('en-US')}`}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {plan.id === 'agency'
                    ? '/month + per-project fees'
                    : price === null
                      ? ''
                      : interval === 'annual' && price > 0
                        ? '/year'
                        : '/month'}
                </span>
              </p>
              {interval === 'annual' && price !== null && price > 0 && plan.monthly !== null && (
                <p className="text-sm text-muted-foreground mb-3">
                  Billed annually. Save ${plan.monthly * 12 - price}/year. MUV allowance resets
                  monthly.
                </p>
              )}
              <ul className="space-y-2 border-t border-line py-4 text-sm">
                <li>
                  {plan.domains === null
                    ? plan.id === 'agency'
                      ? 'Unlimited client projects'
                      : 'Custom domain limits'
                    : `${plan.domains} ${plan.domains === 1 ? 'domain' : 'domains'}${plan.id === 'business' ? ' + subdomains' : ''}`}
                </li>
                <li>
                  {plan.muv === null
                    ? 'Usage allowance agreed in your quote'
                    : `${plan.muv.toLocaleString('en-US')} MUV`}
                </li>
                <li>{plan.retention}</li>
              </ul>
              <p className="text-xs font-semibold text-muted-foreground">
                {plan.id === 'free'
                  ? 'Adds to the open-source core'
                  : quoted
                    ? 'Proposed capabilities'
                    : 'Adds to the preceding tier'}
              </p>
              <ul className="my-4 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="rounded-lg border border-line px-4 py-2 disabled:opacity-60"
                disabled={busy || selected || live || quoted}
                onClick={() =>
                  action(
                    () => request('billing', { plan: plan.id, interval }),
                    'Demo plan changed. No payment was taken.',
                  )
                }
              >
                {selected
                  ? live
                    ? 'Current plan'
                    : 'Current demo plan'
                  : quoted
                    ? 'Custom quote required'
                    : live
                      ? 'Coming soon'
                      : `Try ${plan.name} in demo`}
              </button>
            </article>
          );
        })}
      </div>
      <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-sm space-y-3">
        <p>
          <strong>Paid-plan overages:</strong> proposed rate of approximately $4 per extra 10,000
          MUV. Upgrade prompts are planned at 80% of your allowance. Paid-plan banner delivery
          remains active above the allowance.
        </p>
        <p>
          <strong>Cloud Free:</strong> 2,000 MUV per month, with no overage billing. The planned
          hard cap suspends hosted delivery, publishing and record collection when reached. Account
          access and billing remain available to upgrade. Already-cached scripts may continue
          running on customer websites.
        </p>
        <p>
          <strong>Availability:</strong> proposed packaging includes features still being built:
          scheduled scans, A/B testing, analytics connectors, webhooks, universal consent,
          white-label workflows, SSO, mobile SDKs and certified TCF support.
        </p>
        <p>
          Usage metering, automatic upgrade prompts and overage charging are not active yet. The
          open-source core remains free to self-host.
        </p>
      </div>
    </>
  );
}
