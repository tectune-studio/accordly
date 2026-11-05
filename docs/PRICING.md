# Hosted pricing

The proposed catalog is in `apps/dashboard/lib/billing/plans.ts` and rendered at `/billing` in both live and demo mode. Prices are USD. Starter/Pro/Business annual totals are $120/$490/$1,490; monthly allowances still reset every month. Existing demo `growth` selections display as Pro.

Live payment buttons remain disabled until subscription integration is ready. A catalog entry is not an implemented entitlement. Agency and Enterprise require quotes; no project-rate schedule, Enterprise price, seat count or Agency annual total has been invented.

## Required billing configuration

Provide Stripe recurring Price IDs for Starter, Pro and Business at both monthly and annual intervals. Store STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET securely in deployment settings. Specify the Agency volume/project rate schedule and contact URL. Cloud Free never incurs overage charges. The proposed paid overage rate is $4 per 10,000 extra MUV; rounding and Stripe metered-price configuration must be agreed before charging.

## Confirmed Free cap policy

At 2,000 MUV in a month, suspend hosted delivery, publishing and hosted record collection. Keep account access and billing available to upgrade. Show a persistent upgrade prompt to Free organizations. Restore hosted capabilities after a confirmed paid upgrade or the next monthly usage reset. Paid plans continue banner delivery above their allowance. Existing browser/CDN caches and self-hosted scripts cannot be retroactively disabled; enforcement must cover origin and edge paths, not only dashboard controls. This policy still requires a durable visitor meter and enforcement implementation.

## Remaining implementation

- Stripe Checkout, customer portal, verified/idempotent webhooks and organization subscription storage.
- Verified script-load MUV collection and monthly aggregation; consent-decision counts must not substitute for visitors.
- Persistent Free upgrade prompts, Free hard-cap enforcement, and paid upgrade prompts at 80% with overage invoicing and continued paid banner delivery above limits.
- Server-side domain and premium-feature entitlements, including downgrade behavior.
- Plan-based log retention: the existing database maximum of 395 days must be migrated before Pro/Business 24/36-month retention can be enabled. Do not silently shorten existing customers' retention.
- Agency project pricing and Enterprise contract configuration.

The open-source core remains independent of hosted subscriptions. No overage-based banner blocking has been added.
