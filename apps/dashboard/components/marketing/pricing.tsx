'use client';

import { useState } from 'react';
import { plans } from '@/lib/billing/plans';

export default function Pricing() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  return (
    <section id="pricing" className="section wrap">
      <div className="section-head">
        <p className="eyebrow">YOUR CORE. YOUR CLOUD. YOUR CHOICE.</p>
        <h2>Start small. Grow with confidence.</h2>
        <p>
          Self-host the open-source core without a subscription, or explore our proposed hosted
          plans. Usage is measured in monthly unique visitors (MUV) who load your consent script.
        </p>
        <p>
          Paid checkout is not available yet. Prices, limits and included capabilities below are the
          planned offering; some features are still on the roadmap.
        </p>
      </div>
      <div className="billing-switch" role="group" aria-label="Billing interval">
        {(['monthly', 'annual'] as const).map((value) => (
          <button
            key={value}
            className="button"
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
          >
            {value === 'monthly' ? 'Monthly' : 'Annual — 2 months free'}
          </button>
        ))}
      </div>
      <div className="pricing-grid">
        {plans.map((plan) => {
          const price = plan[interval];
          return (
            <article key={plan.id} className="pricing-card">
              <p className="eyebrow">
                {plan.id === 'free' ? 'HOSTED FOUNDATION' : 'PROPOSED PLAN'}
              </p>
              <h3>{plan.name}</h3>
              <p className="price">
                {plan.id === 'agency'
                  ? 'From $199'
                  : price === null
                    ? 'Custom'
                    : `$${price.toLocaleString('en-US')}`}
                {(price !== null || plan.id === 'agency') && (
                  <small> /{plan.id === 'agency' || interval === 'monthly' ? 'mo' : 'yr'}</small>
                )}
              </p>
              {plan.id === 'agency' && <p>Plus per-project rates. Annual terms by quote.</p>}
              <ul>
                <li>
                  {plan.domains === null
                    ? 'Custom domain limits'
                    : `${plan.domains} ${plan.domains === 1 ? 'domain' : 'domains'}`}
                </li>
                <li>
                  {plan.muv === null
                    ? 'Custom visitor allowance'
                    : `${plan.muv.toLocaleString('en-US')} MUV`}
                </li>
                <li>{plan.retention}</li>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className="button primary" href="/sign-up">
                {plan.id === 'free' ? 'Create your workspace' : 'Sign up to explore'} ↗
              </a>
            </article>
          );
        })}
      </div>
      <p className="legal">
        Annual Starter, Pro and Business pricing includes two months free. Enterprise availability
        and commitments require a separate agreement. See the feature roadmap above for what is
        still planned.
      </p>
    </section>
  );
}
