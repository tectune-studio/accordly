import { adaptConfig, uuidv7, subjectId } from './v1.js';
import { bindElements } from './blocking.js';
/** Standalone core: no network, dependencies, telemetry, or hosted account required. */
export const SDK_VERSION = '0.2.0';
const optional = (config) => config.purposes.filter((p) => !p.required);
export function validateConfig(config) {
  if (
    !config ||
    typeof config.projectId !== 'string' ||
    !config.projectId ||
    typeof config.version !== 'string' ||
    !config.version
  )
    throw new Error('Project and version are required');
  if (!Array.isArray(config.purposes) || config.purposes.length < 1 || config.purposes.length > 20)
    throw new Error('Provide 1–20 purposes');
  const ids = new Set();
  for (const p of config.purposes) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(p.id) || ids.has(p.id))
      throw new Error('Purpose identifiers must be unique');
    if (
      typeof p.name !== 'string' ||
      !p.name.trim() ||
      typeof p.description !== 'string' ||
      typeof p.required !== 'boolean'
    )
      throw new Error('Invalid purpose');
    ids.add(p.id);
  }
  if (!config.purposes.some((p) => p.required))
    throw new Error('A required purpose must be defined');
  if (
    !Number.isInteger(config.expirationDays) ||
    config.expirationDays < 1 ||
    config.expirationDays > 395
  )
    throw new Error('Invalid expiration');
  return config;
}
export function choicesFor(config, allowed = false) {
  return Object.fromEntries(config.purposes.map((p) => [p.id, p.required || allowed]));
}
export function normalizeChoices(config, choices) {
  return Object.fromEntries(
    config.purposes.map((p) => [p.id, p.required || choices?.[p.id] === true]),
  );
}
export function isValidStoredReceipt(config, receipt, now = Date.now()) {
  const timestamp = Date.parse(receipt?.clientTimestamp);
  return Boolean(
    receipt &&
    receipt.projectId === config.projectId &&
    (receipt.configurationVersion === config.version || config.repromptOnConfigChange === false) &&
    typeof receipt.receiptId === 'string' &&
    ['accept', 'reject', 'customize', 'withdraw'].includes(receipt.action) &&
    Number.isFinite(timestamp) &&
    timestamp <= now &&
    timestamp + config.expirationDays * 86400000 > now &&
    config.purposes.every(
      (p) =>
        typeof receipt.choices?.[p.id] === 'boolean' &&
        (!p.required || receipt.choices[p.id] === true),
    ),
  );
}
export function applyGoogleConsent(choices, gtag, mapping) {
  if (mapping) {
    gtag(
      'consent',
      'update',
      Object.fromEntries(
        Object.entries(mapping).map(([signal, category]) => [
          signal,
          choices[category] ? 'granted' : 'denied',
        ]),
      ),
    );
    return;
  }
  gtag('consent', 'update', {
    analytics_storage: choices.analytics ? 'granted' : 'denied',
    ad_storage: choices.marketing ? 'granted' : 'denied',
    ad_user_data: choices.marketing ? 'granted' : 'denied',
    ad_personalization: choices.marketing ? 'granted' : 'denied',
  });
}
export function defaultGoogleConsent(gtag) {
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
}
export function createConsentManager({
  config,
  storage,
  onDecision,
  onEvent,
  country,
  language = 'en',
  googleConsent,
  onError = () => {},
}) {
  const contract = config.schemaVersion ? config : null;
  if (contract) config = adaptConfig(contract, country, language);
  validateConfig(config);
  let subject;

  let receipt = null;
  let current = choicesFor(config, config.mode === 'opt-out');
  let ui = null,
    uiGeneration = 0;
  const subscribers = new Set();
  const key = `consentkit:${config.projectId}`;
  const cookieKey = encodeURIComponent(key);
  const gpc = () => Boolean(globalThis.navigator?.globalPrivacyControl);
  const enforceGpc = () => {
    if (gpc() && config.respectGpc)
      for (const id of config.gpcCategories || ['marketing'])
        if (id !== 'necessary') current[id] = false;
  };
  let unblock = () => {};
  const safeError = (e) => {
    try {
      onError(e);
    } catch {}
  };
  const local = () => storage ?? globalThis.localStorage;
  const emit = () => {
    if (typeof window !== 'undefined')
      window.dispatchEvent(
        new CustomEvent('consentkit:change', {
          detail: { choices: { ...current }, state: receipt ? 'decided' : 'unknown' },
        }),
      );
    for (const cb of subscribers) {
      try {
        cb({ ...current });
      } catch (e) {
        safeError(e);
      }
    }
  };
  const manager = {
    initialize() {
      if (!googleConsent && typeof window !== 'undefined') {
        window.dataLayer ??= [];
        googleConsent =
          window.gtag ??
          function () {
            window.dataLayer.push(arguments);
          };
      }
      if (googleConsent) defaultGoogleConsent(googleConsent);
      subject ??= subjectId(
        storage ??
          (() => {
            try {
              return globalThis.localStorage;
            } catch {
              return null;
            }
          })(),
      );
      try {
        const cookie =
          typeof document === 'undefined'
            ? null
            : document.cookie
                .split('; ')
                .find((v) => v.startsWith(cookieKey + '='))
                ?.slice(cookieKey.length + 1);
        const saved = JSON.parse(
          cookie ? decodeURIComponent(cookie) : local().getItem(key) || 'null',
        );
        if (isValidStoredReceipt(config, saved)) {
          receipt = saved;
          current = normalizeChoices(config, saved.choices);
        }
      } catch (e) {
        safeError(e);
      }
      enforceGpc();
      if (googleConsent) applyGoogleConsent(current, googleConsent, contract?.googleSignals);
      emit();
      if (typeof document !== 'undefined') {
        unblock();
        unblock = bindElements(manager, document, config.scriptRules);
      }
      return manager;
    },
    getState: () => (receipt ? 'decided' : 'unknown'),
    getConsent: () => ({ ...current }),
    getReceipt: () => (receipt ? structuredClone(receipt) : null),
    hasDecision: () => receipt !== null,
    isAllowed(id) {
      return current[id] === true;
    },
    onConsentChange(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    gate(id, enable, disable = () => {}) {
      if (!config.purposes.some((p) => p.id === id)) throw new Error('Unknown purpose');
      let active = false;
      const update = (choices) => {
        if (choices[id] && !active) {
          enable();
          active = true;
        } else if (!choices[id] && active) {
          disable();
          active = false;
        }
      };
      update(current);
      const unsubscribe = manager.onConsentChange(update);
      return () => {
        unsubscribe();
        if (active) disable();
      };
    },
    setConsent(choices, action = 'customize') {
      const hadDecision = receipt !== null;
      if (!['accept', 'reject', 'customize', 'withdraw'].includes(action))
        throw new Error('Invalid action');
      current =
        action === 'accept'
          ? choicesFor(config, true)
          : ['reject', 'withdraw'].includes(action)
            ? choicesFor(config)
            : normalizeChoices(config, choices);
      enforceGpc();
      receipt = {
        receiptId: globalThis.crypto.randomUUID(),
        projectId: config.projectId,
        configurationVersion: config.version,
        choices: { ...current },
        action,
        clientTimestamp: new Date().toISOString(),
        sdkVersion: SDK_VERSION,
        source: 'banner',
      };
      try {
        local().setItem(key, JSON.stringify(receipt));
      } catch (e) {
        safeError(e);
      }
      enforceGpc();
      if (typeof document !== 'undefined')
        try {
          document.cookie =
            cookieKey +
            '=' +
            encodeURIComponent(JSON.stringify(receipt)) +
            '; Path=/; Max-Age=' +
            config.expirationDays * 86400 +
            '; Secure; SameSite=Lax';
        } catch (e) {
          safeError(e);
        }
      if (googleConsent) applyGoogleConsent(current, googleConsent, contract?.googleSignals);
      emit();
      if (onEvent && contract) {
        const event = {
          schemaVersion: 1,
          eventId: uuidv7(),
          projectId: config.projectId,
          subjectId: subject,
          configHash: contract.configHash,
          action: {
            accept: 'accept_all',
            reject: 'reject_all',
            customize: hadDecision ? 'update' : 'custom',
            withdraw: 'withdraw',
          }[action],
          choices: Object.fromEntries(Object.entries(current).filter(([id]) => id !== 'necessary')),
          language,
          gpcDetected: gpc(),
          clientTime: receipt.clientTimestamp,
          ...(country ? { country } : {}),
        };
        if (gpc() && config.respectGpc && event.action === 'accept_all') event.action = 'custom';
        try {
          Promise.resolve(onEvent(event)).catch(safeError);
        } catch (e) {
          safeError(e);
        }
      }
      if (onDecision) {
        try {
          Promise.resolve(onDecision(structuredClone(receipt))).catch(safeError);
        } catch (e) {
          safeError(e);
        }
      }
      manager.close();
      return structuredClone(receipt);
    },
    acceptAll: () => manager.setConsent({}, 'accept'),
    rejectAll: () => manager.setConsent({}, 'reject'),
    withdraw: () => manager.setConsent({}, 'withdraw'),
    async showPreferences() {
      const generation = uiGeneration;
      const { createUI } = await import('./ui.js');
      if (generation !== uiGeneration) return;
      ui ??= createUI(config, manager);
      ui.show();
    },
    close() {
      uiGeneration++;
      ui?.close();
    },
    destroy() {
      manager.close();
      unblock();
      subscribers.clear();
    },
  };
  return manager;
}
