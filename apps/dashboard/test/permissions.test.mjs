import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertPermission, roleFromClerk } from '../lib/server/permissions.mjs';
test('unknown Clerk roles fail closed and ordinary members map to viewers', () => {
  assert.equal(roleFromClerk('org:member'), 'viewer');
  assert.equal(roleFromClerk('org:invented'), null);
  assert.throws(() => assertPermission(null, 'read'));
});
test('viewers cannot edit and editors cannot publish or manage memberships', () => {
  assertPermission('viewer', 'read');
  assertPermission('editor', 'edit');
  assertPermission('admin', 'manage');
  for (const [role, action] of [
    ['viewer', 'edit'],
    ['viewer', 'publish'],
    ['editor', 'publish'],
    ['editor', 'manage'],
  ])
    assert.throws(() => assertPermission(role, action));
});
