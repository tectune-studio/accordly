/* Load this classic script first in <head>, without async/defer, before GTM/gtag. */
(function () {
  const tag = document.currentScript;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  if (!tag?.dataset.config) return;
  const source = new URL(tag.src);
  import(new URL('consent.js', source).href)
    .then(async (sdk) => {
      let storage;
      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }
      const config = await sdk.loadHostedConfig(tag.dataset.config, { storage });
      let country = tag.dataset.country;
      if (!country) {
        try {
          const response = await fetch(new URL('/cdn-cgi/trace', tag.dataset.config), {
            credentials: 'omit',
            signal: AbortSignal.timeout(2000),
          });
          if (response.ok) country = (await response.text()).match(/^loc=([A-Z]{2})$/m)?.[1];
        } catch {} // Missing or blocked detection uses strict opt-in.
      }
      if (document.readyState === 'loading')
        await new Promise((resolve) =>
          document.addEventListener('DOMContentLoaded', resolve, { once: true }),
        );
      const transport = tag.dataset.ingest
        ? (await import(new URL('transport.js', source).href)).createEventTransport({
            endpoint: tag.dataset.ingest,
            projectId: config.projectId,
            storage,
            onError: (error) => console.error('Accordly receipt delivery', error),
          })
        : null;
      const manager = sdk
        .createConsentManager({
          config,
          country,
          language: document.documentElement.lang || config.defaultLanguage,
          onError: (error) => console.error('ConsentKit', error),
          onEvent: (event) => {
            window.dispatchEvent(new CustomEvent('accordly:decision', { detail: event }));
            transport?.enqueue(event);
          },
        })
        .initialize();
      window.ConsentKit = manager;
      if (!manager.hasDecision()) await manager.showPreferences();
    })
    .catch((error) =>
      console.error('ConsentKit initialization failed; optional scripts remain inert.', error),
    );
})();
