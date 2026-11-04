import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import formats from 'ajv-formats';
import * as validators from '../src/index.js';
for (const [file, name] of [
  ['banner-config', 'BannerConfig'],
  ['consent-event', 'ConsentEvent'],
])
  test(`${name} example validates with JSON Schema and Zod`, async () => {
    const schema = JSON.parse(
      await readFile(new URL(`../schemas/${file}.schema.json`, import.meta.url)),
    );
    const example = JSON.parse(
      await readFile(new URL(`../examples/${file}.json`, import.meta.url)),
    );
    const ajv = new Ajv({ strict: false });
    formats(ajv);
    assert.equal(ajv.validate(schema, example), true, JSON.stringify(ajv.errors));
    assert.equal(validators[name + 'Schema'].safeParse(example).success, true);
    assert.equal(
      validators[name + 'Schema'].safeParse({ ...example, rawIp: '127.0.0.1' }).success,
      false,
    );
    assert.equal(
      validators[name + 'Reader'].safeParse({ ...example, futureField: true }).success,
      true,
    );
    assert.equal(
      validators[name + 'Schema'].safeParse({ ...example, schemaVersion: 2 }).success,
      false,
    );
  });

test('hash identifies canonical config content and readers tolerate nested future fields', async () => {
  const { configHash } = await import('../src/hash.js');
  const c = JSON.parse(await readFile(new URL('../examples/banner-config.json', import.meta.url)));
  assert.equal(await configHash(c), c.configHash);
  assert.notEqual(await configHash({ ...c, defaultLanguage: 'de' }), c.configHash);
  assert.equal(
    validators.BannerConfigReader.safeParse({ ...c, theme: { ...c.theme, futureToken: 'x' } })
      .success,
    true,
  );
  assert.equal(
    validators.BannerConfigSchema.safeParse({ ...c, theme: { ...c.theme, futureToken: 'x' } })
      .success,
    false,
  );
});

test('strict config requires every category exactly once', async () => {
  const c = JSON.parse(await readFile(new URL('../examples/banner-config.json', import.meta.url)));
  c.categories[3] = c.categories[0];
  assert.equal(validators.BannerConfigSchema.safeParse(c).success, false);
});
