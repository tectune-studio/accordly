import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { landingMetadata, landingStructuredData, serializeJsonLd } from '../lib/landing/seo.ts';

test('landing metadata describes the implemented consent product consistently', () => {
  assert.match(landingMetadata.title, /Accordly.*Open-source cookie consent/);
  assert.match(landingMetadata.description, /Google Consent Mode v2/);
  for (const keyword of [
    'open source cookie consent',
    'consent management platform',
    'GDPR consent management',
    'ePrivacy cookie consent',
    'CCPA privacy choices',
    'CPRA privacy choices',
    'Google Consent Mode v2',
    'GPC',
  ]) {
    assert.ok(landingMetadata.keywords.includes(keyword));
  }
  assert.equal(landingMetadata.openGraph.type, 'website');
  assert.equal(landingMetadata.twitter.card, 'summary');
  for (const social of [landingMetadata.openGraph, landingMetadata.twitter]) {
    assert.equal(social.title, landingMetadata.title);
    assert.equal(social.description, landingMetadata.description);
  }
});

test('no unconfigured canonical, site origin, social image or account is invented', () => {
  assert.equal(landingMetadata.metadataBase, undefined);
  assert.equal(landingMetadata.alternates, undefined);
  assert.equal(landingMetadata.openGraph.url, undefined);
  assert.equal(landingMetadata.openGraph.images, undefined);
  assert.equal(landingMetadata.twitter.images, undefined);
  assert.equal(landingMetadata.twitter.site, undefined);
  assert.equal(landingMetadata.twitter.creator, undefined);
  for (const entity of landingStructuredData['@graph']) {
    assert.equal(entity.url, undefined);
    assert.match(entity['@id'], /^#/);
  }
});

test('structured data links the website and software using factual features only', () => {
  assert.equal(landingStructuredData['@context'], 'https://schema.org');
  const [website, software] = landingStructuredData['@graph'];
  assert.equal(website['@type'], 'WebSite');
  assert.equal(software['@type'], 'SoftwareApplication');
  assert.equal(website.about['@id'], software['@id']);
  assert.equal(software.description, landingMetadata.description);
  assert.ok(software.featureList.some((feature) => feature.includes('Google Consent Mode v2')));
  assert.ok(
    software.featureList.some((feature) => feature.includes('Regional Global Privacy Control')),
  );
  for (const entity of landingStructuredData['@graph']) {
    for (const field of ['offers', 'aggregateRating', 'review', 'hasCertification']) {
      assert.equal(entity[field], undefined);
    }
  }
  assert.doesNotMatch(
    serializeJsonLd(landingStructuredData),
    /guaranteed|certified|SSO|data residency|website scanning|native mobile/i,
  );
});

test('JSON-LD serialization prevents script termination while preserving content', () => {
  const payload = { text: '</script><script>alert("x")</script> & <tag>\u2028\u2029' };
  const serialized = serializeJsonLd(payload);
  assert.ok(!serialized.includes('<'));
  assert.ok(serialized.includes('\\u003c/script>'));
  assert.deepEqual(JSON.parse(serialized), payload);
  assert.deepEqual(JSON.parse(serializeJsonLd(landingStructuredData)), landingStructuredData);
});

test('the server page emits safely serialized JSON-LD alongside the unchanged landing', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /['"]use client['"]/);
  assert.match(page, /metadata: Metadata = landingMetadata/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(page, /__html: serializeJsonLd\(landingStructuredData\)/);
  assert.match(page, /<LandingPage \/>/);
});
