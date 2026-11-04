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
