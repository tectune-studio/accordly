import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createConsentManager,
  isValidStoredReceipt,
  validateConfig,
  defaultGoogleConsent,
} from '../src/index.js';
const config = {
  projectId: 'p',
  version: 'v1',
  title: 'Privacy',
  description: 'Choose',
  privacyUrl: 'https://example.com/privacy',
  expirationDays: 180,
  purposes: [
    { id: 'necessary', name: 'Necessary', description: 'Essential', required: true },
    { id: 'analytics', name: 'Analytics', description: 'Measurement', required: false },
    { id: 'marketing', name: 'Marketing', description: 'Advertising', required: false },
  ],
};
const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v) };
};
test('optional gates remain off before consent and stop after withdrawal', () => {
  const storage = memory();
  const m = createConsentManager({ config, storage }).initialize();
  let starts = 0,
    stops = 0;
  const cleanup = m.gate(
    'analytics',
    () => starts++,
    () => stops++,
  );
  assert.equal(m.isAllowed('analytics'), false);
  assert.equal(starts, 0);
  assert.equal(m.hasDecision(), false);
  m.acceptAll();
  assert.equal(starts, 1);
  assert.equal(m.isAllowed('necessary'), true);
  m.acceptAll();
  assert.equal(starts, 1);
  m.withdraw();
  assert.equal(stops, 1);
  assert.equal(m.isAllowed('analytics'), false);
  cleanup();
  assert.equal(stops, 1);
});
test('granular choices cannot disable required purposes or enable unknown ones', () => {
  const m = createConsentManager({ config, storage: memory() }).initialize();
  const r = m.setConsent({ necessary: false, analytics: true, marketing: false, rogue: true });
  assert.deepEqual(r.choices, { necessary: true, analytics: true, marketing: false });
  assert.equal(r.action, 'customize');
  m.rejectAll();
  assert.deepEqual(m.getConsent(), { necessary: true, analytics: false, marketing: false });
});
test('preferences persist, but changed configuration and expiration require a new decision', () => {
  const storage = memory();
  const r = createConsentManager({ config, storage }).initialize().acceptAll();
  assert.equal(createConsentManager({ config, storage }).initialize().hasDecision(), true);
  assert.equal(
    createConsentManager({ config: { ...config, version: 'v2' }, storage })
      .initialize()
      .hasDecision(),
    false,
  );
  assert.equal(
    isValidStoredReceipt(config, r, Date.parse(r.clientTimestamp) + 181 * 86400000),
    false,
  );
  assert.equal(isValidStoredReceipt(config, r, Date.parse(r.clientTimestamp) - 10000), false);
  assert.equal(
    isValidStoredReceipt(config, {
      ...r,
      choices: { necessary: false, analytics: true, marketing: true },
    }),
    false,
  );
});
test('malformed storage and sink failures do not bypass gates', async () => {
  const errors = [];
  const m = createConsentManager({
    config,
    storage: {
      getItem() {
        return '{bad';
      },
      setItem() {
        throw new Error('storage denied');
      },
    },
    onDecision() {
      throw new Error('offline');
    },
    onError: (e) => errors.push(e.message),
  }).initialize();
  assert.equal(m.isAllowed('analytics'), false);
  m.acceptAll();
  assert.equal(m.isAllowed('analytics'), true);
  assert.equal(errors.length, 3);
  assert.equal(errors[1], 'storage denied');
  assert.equal(errors[2], 'offline');
});
test('Google defaults deny before updates and map all four signals', () => {
  const calls = [];
  const m = createConsentManager({
    config,
    storage: memory(),
    googleConsent: (...args) => calls.push(args),
  }).initialize();
  assert.equal(calls[0][1], 'default');
  assert.equal(calls[0][2].ad_user_data, 'denied');
  m.setConsent({ analytics: true });
  const update = calls.at(-1)[2];
  assert.equal(update.analytics_storage, 'granted');
  assert.equal(update.ad_storage, 'denied');
  assert.equal(update.ad_user_data, 'denied');
  assert.equal(update.ad_personalization, 'denied');
});
test('reject malformed purpose configuration and expiration', () => {
  assert.throws(
    () => validateConfig({ ...config, purposes: [...config.purposes, config.purposes[0]] }),
    /unique/,
  );
  assert.throws(() => validateConfig({ ...config, expirationDays: 0 }), /expiration/);
  assert.throws(
    () => createConsentManager({ config, storage: memory() }).gate('unknown', () => {}),
    /Unknown/,
  );
});
test('consumer mutations cannot alter the stored decision', () => {
  const m = createConsentManager({ config, storage: memory() }).initialize();
  const r = m.acceptAll();
  r.choices.analytics = false;
  const receipt = m.getReceipt();
  receipt.choices.marketing = false;
  assert.equal(m.getReceipt().choices.analytics, true);
  assert.equal(m.getReceipt().choices.marketing, true);
});
