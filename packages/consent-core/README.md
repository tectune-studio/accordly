# @consentkit/core

Framework-independent consent UI, first-party preferences, integration gates, and Google Consent Mode adapter. No hosted account or telemetry required. Apache-2.0.

```js
import { createConsentManager } from '@consentkit/core';
const manager = createConsentManager({ config }).initialize();
const release = manager.gate('analytics', startAnalytics, stopAnalytics);
if (!manager.hasDecision()) manager.showPreferences();
// Later:
manager.showPreferences();
manager.withdraw();
```

Supply a config with projectId, version, title, description, privacyUrl, expirationDays, and purposes (`id`, `name`, `description`, `required`). Keep the config version immutable. Increment it when consent requirements change. Pass an optional `onDecision(receipt)` sink to store receipts yourself. Storage failures leave preferences functional in memory; persistence is then unavailable. The sink must handle durable delivery and retry if required.

Initialize before optional tags. Explicitly gate each integration; the SDK cannot reverse a request already made. A disable callback must stop future processing; removing a script element does not unload a vendor SDK. Use vendor-specific teardown or reload when required. Consent Mode is optional; register its default command before loading Google tags. Browser receipts are untrusted client assertions, not proof of identity.

## Version 1 contracts and startup ordering

The manager also accepts `BannerConfig` from `@consentkit/schema`, a `country`, `language`, and an `onEvent(event)` callback for the v1 event format. `getState()` returns `unknown` or `decided`. The old configuration and `onDecision` callback remain supported. `showPreferences()` now returns a Promise and imports the UI lazily.

For direct website delivery, put the **classic, synchronous** `loader.js` first in the head, without `async`, `defer`, or `type="module"`. It queues Google's denied defaults with `wait_for_update: 500` before fetching config or loading the module graph. Module-only installation must separately call/queue those defaults synchronously before GTM/gtag.

```html
<script
  src="https://your-delivery-host/sdk/0.2.0/loader.js"
  data-config="https://your-delivery-host/config/PROJECT/current"
  data-country="DE"
></script>
<script type="text/plain" data-consent-category="analytics" src="/analytics.js"></script>
<iframe data-consent-category="marketing" data-src="https://your-embed-host/"></iframe>
<button data-consent-preferences>Privacy preferences</button>
```

The loader exposes `window.ConsentKit`, emits `consentkit:change` (choices/state), and forwards decision payloads through `consentkit:decision`. Hosts attach a durable transport to that decision event or use `onEvent`. Retry the same event ID; do not generate a new event for each retry.

Decisions are stored in a host-only Secure, SameSite=Lax cookie with a configured Max-Age, mirrored in localStorage. HTTPS is required outside localhost. GPC disables the configured categories where the selected region rule respects it. Opt-in is the conservative fallback; opt-out regions can enable optional categories before a decision, while the initial preferences UI leaves optional checkboxes unchecked. Vendor cookies are catalog metadata: the SDK does not claim to remove every vendor cookie or undo already-executed scripts. Withdrawal stops future gated activation and clears activated iframe sources; site-owned SDKs still need teardown callbacks.

Have counsel confirm per-region wording, default choices, and any consent-wall policy before deployment. `npm test` enforces a combined 15 KiB gzip budget for all shipped JS modules, including the lazy UI.
