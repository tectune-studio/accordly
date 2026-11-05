import { test } from 'node:test';
import assert from 'node:assert/strict';
import { date, human, getConsentStats, buildInstallSnippet } from '../lib/dashboard/utils.ts';

test('consent stats default to zero without a state or recorded activity', () => {
  const expected = { total: 0, accepted: 0, rejected: 0, customized: 0, active: 0 };
  assert.deepEqual(getConsentStats(null), expected);
  assert.deepEqual(getConsentStats({ projects: [], receipts: [] }), expected);
});

test('consent stats count each decision and only projects with active releases', () => {
  const state = {
    projects: [
      { id: 'proj_draft', activeRelease: null },
      { id: 'proj_live', activeRelease: 'release_1' },
      { id: 'proj_live_2', activeRelease: 'release_2' },
      { id: 'proj_empty', activeRelease: '' },
    ],
    receipts: [
      { action: 'accept' },
      { action: 'reject' },
      { action: 'accept' },
      { action: 'customize' },
      { action: 'withdraw' },
      { action: 'withdraw' },
    ],
  };
  const before = structuredClone(state);

  assert.deepEqual(getConsentStats(state), {
    total: 6,
    accepted: 2,
    rejected: 1,
    customized: 1,
    active: 2,
  });
  assert.deepEqual(state, before);
});

test('human capitalizes only the first character and accepts an empty string', () => {
  assert.equal(human('accept'), 'Accept');
  assert.equal(human('custom preferences'), 'Custom preferences');
  assert.equal(human('cUSTOM'), 'CUSTOM');
  assert.equal(human('Already capitalized'), 'Already capitalized');
  assert.equal(human(''), '');
});

test('date uses the current locale with a short month, numeric day and year', () => {
  for (const value of ['2026-06-15T12:00:00Z', '2025-12-31T23:30:00-08:00']) {
    assert.equal(
      date(value),
      new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    );
  }
});

test('install snippet is empty without a project', () => {
  assert.equal(buildInstallSnippet(undefined, 'https://dashboard.example'), '');
  assert.equal(buildInstallSnippet(undefined, ''), '');
});

test('install snippet preserves SDK setup, origin and the selected project ID', () => {
  assert.equal(
    buildInstallSnippet({ id: 'proj_site-2' }, 'https://dashboard.example:8443'),
    [
      '<script type="module">',
      "  import { createConsentManager } from 'https://dashboard.example:8443/api/sdk/0.2.0/consent.js';",
      "  const config = await fetch('https://dashboard.example:8443/api/public/proj_site-2/current').then(r => r.json());",
      '  const cmp = createConsentManager({ config }).initialize();',
      '  // Gate optional integrations with cmp.gate() before loading them.',
      '  if (!cmp.hasDecision()) cmp.showPreferences();',
      '</script>',
    ].join('\n'),
  );
});

test('install snippet uses relative URLs with an empty origin and follows the project ID', () => {
  const snippet = buildInstallSnippet({ id: 'proj_other' }, '');
  assert.ok(snippet.includes("from '/api/sdk/0.2.0/consent.js'"));
  assert.ok(snippet.includes("fetch('/api/public/proj_other/current')"));
  assert.ok(!snippet.includes('undefined'));
});
