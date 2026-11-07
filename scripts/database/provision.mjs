import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { Client, loadConfig, connectConfig } from './common.mjs';
loadConfig();
const client = new Client(connectConfig(process.env.DATABASE_URL));
try {
  await client.connect();
  const values = {};
  for (const [role, key] of [
    ['accordly_app', 'ACCORDLY_DATABASE_URL'],
    ['accordly_maintenance', 'ACCORDLY_MAINTENANCE_DATABASE_URL'],
  ]) {
    const password = randomBytes(36).toString('base64url');
    // Identifiers are fixed, and passwords contain only base64url characters.
    await client.query(`alter role ${role} password '${password}'`);
    const url = new URL(process.env.DATABASE_URL);
    const suffix = decodeURIComponent(url.username).split('.').slice(1).join('.');
    url.username = role + (suffix ? '.' + suffix : '');
    url.password = password;
    values[key] = url.toString();
  }
  const p = 'apps/dashboard/.env.local';
  let lines = (await readFile(p, 'utf8'))
    .split('\n')
    .filter((l) => !Object.keys(values).some((k) => l.startsWith(k + '=')));
  lines.push(...Object.entries(values).map(([k, v]) => k + '=' + v));
  await writeFile(p, lines.join('\n') + '\n');
  await chmod(p, 0o600);
  console.log('Restricted role credentials saved to ignored local configuration.');
} catch (e) {
  console.error('Role provisioning failed:', e.code || '', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
