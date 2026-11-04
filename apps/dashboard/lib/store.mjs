import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { makeConfig } from './domain.mjs';
const directory = process.env.CONSENTKIT_DATA_DIR || path.join(process.cwd(), '.data');
const file = path.join(directory, 'store.json');
const initial = () => ({
  schema: 1,
  organization: { id: 'org_demo', name: 'Acme Studio', plan: 'free' },
  projects: [
    {
      id: 'proj_studio',
      name: 'Studio website',
      domain: 'studio.example',
      createdAt: new Date().toISOString(),
      draft: makeConfig('proj_studio'),
      releases: [],
      activeRelease: null,
    },
  ],
  receipts: [],
  audit: [],
});
let chain = Promise.resolve();
async function load() {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return initial();
    throw e;
  }
}
export async function readStore() {
  await chain;
  return load();
}
export function mutateStore(fn) {
  const run = chain.then(async () => {
    const state = await load();
    const result = await fn(state);
    await mkdir(directory, { recursive: true });
    const temp = file + '.tmp';
    await writeFile(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
    await rename(temp, file);
    return result;
  });
  chain = run.catch(() => {});
  return run;
}
export function audit(state, action, projectId) {
  state.audit.unshift({
    id: crypto.randomUUID(),
    action,
    projectId,
    at: new Date().toISOString(),
    actor: 'Demo owner',
  });
  state.audit = state.audit.slice(0, 500);
}
