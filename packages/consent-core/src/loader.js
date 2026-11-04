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
  Promise.all([
    import(new URL('consent.js', source).href),
    fetch(tag.dataset.config).then((r) => {
      if (!r.ok) throw new Error('Consent configuration unavailable');
      return r.json();
    }),
  ])
    .then(async ([sdk, config]) => {
      if (document.readyState === 'loading')
        await new Promise((resolve) =>
          document.addEventListener('DOMContentLoaded', resolve, { once: true }),
        );
      const manager = sdk
        .createConsentManager({
          config,
          country: tag.dataset.country,
          language: document.documentElement.lang || config.defaultLanguage,
          onError: (error) => console.error('ConsentKit', error),
          onEvent: (event) =>
            window.dispatchEvent(new CustomEvent('consentkit:decision', { detail: event })),
        })
        .initialize();
      window.ConsentKit = manager;
      if (!manager.hasDecision()) await manager.showPreferences();
    })
    .catch((error) =>
      console.error('ConsentKit initialization failed; optional scripts remain inert.', error),
    );
})();
