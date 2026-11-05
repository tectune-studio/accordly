/** Standalone core: no network, dependencies, telemetry, or hosted account required. */
export const SDK_VERSION = '0.1.0';
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
    receipt.configurationVersion === config.version &&
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
export function applyGoogleConsent(choices, gtag) {
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
  });
}
export function createConsentManager({
  config,
  storage,
  onDecision,
  googleConsent,
  onError = () => {},
}) {
  validateConfig(config);
  let receipt = null;
  let current = choicesFor(config);
  let root = null;
  let returnFocus = null;
  const subscribers = new Set();
  const key = `accordly:${config.projectId}`;
  const safeError = (e) => {
    try {
      onError(e);
    } catch {}
  };
  const local = () => storage ?? globalThis.localStorage;
  const emit = () => {
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
      if (googleConsent) defaultGoogleConsent(googleConsent);
      try {
        const saved = JSON.parse(local().getItem(key) || 'null');
        if (isValidStoredReceipt(config, saved)) {
          receipt = saved;
          current = normalizeChoices(config, saved.choices);
        }
      } catch (e) {
        safeError(e);
      }
      if (googleConsent) applyGoogleConsent(current, googleConsent);
      emit();
      return manager;
    },
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
      if (!['accept', 'reject', 'customize', 'withdraw'].includes(action))
        throw new Error('Invalid action');
      current =
        action === 'accept'
          ? choicesFor(config, true)
          : ['reject', 'withdraw'].includes(action)
            ? choicesFor(config)
            : normalizeChoices(config, choices);
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
      if (googleConsent) applyGoogleConsent(current, googleConsent);
      emit();
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
    showPreferences() {
      if (typeof document === 'undefined') throw new Error('UI requires a browser');
      if (root) {
        root.shadowRoot.querySelector('button')?.focus();
        return;
      }
      returnFocus = document.activeElement;
      root = document.createElement('div');
      if (/^#[a-f0-9]{6}$/i.test(config.brandColor || ''))
        root.style.setProperty('--ck-accent', config.brandColor);
      const shadow = root.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `:host{all:initial;position:fixed;inset:0;z-index:2147483647;background:#10182866;display:flex;align-items:flex-end;justify-content:center;padding:20px;box-sizing:border-box;font:14px/1.5 system-ui;color:#172b29}*{box-sizing:border-box}.panel{background:white;border:1px solid #d5dfdc;border-radius:18px;padding:28px;width:min(540px,100%);max-height:85vh;overflow:auto;box-shadow:0 20px 80px #102c2933}h2{font-size:23px;margin:0 0 8px}p{color:#536b65}label{display:flex;gap:12px;align-items:flex-start;padding:13px 0;border-bottom:1px solid #edf1ef}input{margin-top:5px;accent-color:var(--ck-accent,#16836c);width:18px;height:18px}small{display:block;color:#536b65}footer{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}button{background:#eff6f3;color:#172b29;border:1px solid #cadbd4;border-radius:8px;padding:11px 15px;cursor:pointer;font:600 13px system-ui}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #157c66;outline-offset:3px}button.primary{background:var(--ck-accent,#166b58);color:white;border-color:var(--ck-accent,#166b58)}a{color:#166b58}`;
      shadow.append(style);
      const panel = document.createElement('section');
      panel.className = 'panel';
      panel.role = 'dialog';
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'ck-title');
      const heading = document.createElement('h2');
      heading.id = 'ck-title';
      heading.textContent = config.title || 'Your privacy, your choice';
      const description = document.createElement('p');
      description.textContent =
        config.description ||
        'Choose which optional services may run on this website. You can change your mind at any time.';
      panel.append(heading, description);
      const selected = { ...current };
      for (const p of config.purposes) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = selected[p.id];
        input.disabled = p.required;
        input.addEventListener('change', () => {
          selected[p.id] = input.checked;
        });
        const text = document.createElement('span');
        text.textContent = p.name + (p.required ? ' · always active' : '');
        const detail = document.createElement('small');
        detail.textContent = p.description;
        text.append(detail);
        label.append(input, text);
        panel.append(label);
      }
      if (config.privacyUrl) {
        try {
          const url = new URL(config.privacyUrl);
          if (['https:', 'http:'].includes(url.protocol)) {
            const link = document.createElement('a');
            link.href = url.href;
            link.textContent = 'Privacy policy';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            panel.append(link);
          }
        } catch {}
      }
      const footer = document.createElement('footer');
      for (const [label, click] of [
        ['Reject optional', manager.rejectAll],
        ['Accept all', manager.acceptAll],
        ['Save preferences', () => manager.setConsent(selected)],
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        if (label === 'Save preferences') button.className = 'primary';
        button.onclick = click;
        footer.append(button);
      }
      panel.append(footer);
      shadow.append(panel);
      shadow.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && manager.hasDecision()) manager.close();
        if (e.key !== 'Tab') return;
        const focusable = [...shadow.querySelectorAll('button,input:not(:disabled),a')];
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && shadow.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && shadow.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      });
      document.body.append(root);
      shadow.querySelector('input:not(:disabled),button')?.focus();
    },
    close() {
      root?.remove();
      root = null;
      returnFocus?.focus?.();
    },
    destroy() {
      manager.close();
      subscribers.clear();
    },
  };
  return manager;
}
