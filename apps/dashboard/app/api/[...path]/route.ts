import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readStore, mutateStore, audit } from '../../../lib/store.mjs';
import { makeConfig, parseConfig, parseProject, validateReceipt } from '../../../lib/domain.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
function demoOnly() {
  if (process.env.CONSENTKIT_MODE !== 'demo')
    throw new Error(
      'Live mode is not implemented. Configure production authentication and storage before enabling this server.',
    );
}
async function body(req: NextRequest) {
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Request body required');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) {
      await reader.cancel();
      throw new Error('Request too large');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  // Next may construct nextUrl with the bind address (0.0.0.0). Use the browser-facing Host.
  if (origin) {
    const parsed = new URL(origin);
    if (parsed.host !== req.headers.get('host') || parsed.protocol !== req.nextUrl.protocol)
      throw new Error('Cross-origin administration is not allowed');
  }
}
function project(state: any, id: string) {
  const p = state.projects.find((p: any) => p.id === id);
  if (!p) throw new Error('Project not found');
  return p;
}
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    demoOnly();
    const { path } = await params;
    if (path.join('/') === 'sdk/0.1.0/consent.js') {
      const source = await readFile(
        join(process.cwd(), '../../packages/consent-core/src/index.js'),
        'utf8',
      );
      return new NextResponse(source, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public,max-age=31536000,immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    const state = await readStore();
    if (path[0] === 'public' && path[1]) {
      const p = project(state, path[1]);
      const release =
        path[2] && path[2] !== 'current'
          ? p.releases.find((r: any) => r.id === path[2])
          : p.releases.find((r: any) => r.id === p.activeRelease);
      if (!release) return json({ error: 'Publish a configuration first' }, 404);
      return json(release.config, 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':
          path[2] && path[2] !== 'current'
            ? 'public,max-age=31536000,immutable'
            : 'public,max-age=30',
      });
    }
    if (path[0] === 'export') {
      return new NextResponse(
        JSON.stringify({ exportedAt: new Date().toISOString(), receipts: state.receipts }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="consent-receipts.json"',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    if (path.join('/') === 'state') return json(state);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400);
  }
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    demoOnly();
    sameOrigin(req);
    const { path } = await params;
    const input = await body(req);
    if (path[0] === 'projects' && !path[1]) {
      const fields = parseProject(input);
      const result = await mutateStore((state: any) => {
        const id = 'proj_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
        if (state.projects.length >= 20) throw new Error('Demo is limited to 20 projects');
        const p = {
          id,
          ...fields,
          createdAt: new Date().toISOString(),
          draft: makeConfig(id),
          releases: [],
          activeRelease: null,
        };
        state.projects.push(p);
        audit(state, 'Project created', id);
        return p;
      });
      return json(result, 201);
    }
    if (path[0] === 'projects' && path[1]) {
      const result = await mutateStore((state: any) => {
        const p = project(state, path[1]);
        if (path[2] === 'draft') {
          p.draft = parseConfig(input, p.id);
          audit(state, 'Draft saved', p.id);
          return p;
        }
        if (path[2] === 'publish') {
          const id = 'rel_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
          const config = { ...parseConfig(p.draft, p.id), version: id };
          const release = { id, createdAt: new Date().toISOString(), config };
          p.releases.unshift(release);
          p.activeRelease = id;
          audit(state, 'Configuration published', p.id);
          return release;
        }
        if (path[2] === 'rollback') {
          if (!p.releases.some((r: any) => r.id === input.releaseId))
            throw new Error('Release not found');
          p.activeRelease = input.releaseId;
          audit(state, 'Release restored', p.id);
          return p;
        }
        throw new Error('Unknown operation');
      });
      return json(result);
    }
    if (path[0] === 'receipts') {
      const result = await mutateStore((state: any) => {
        const p = project(state, input.projectId);
        const release = p.releases.find((r: any) => r.id === input.configurationVersion);
        if (!release) throw new Error('Release not found');
        const receipt = validateReceipt(input, release.config);
        if (
          state.receipts.some(
            (r: any) => r.receiptId === receipt.receiptId && r.projectId === receipt.projectId,
          )
        )
          return { duplicate: true };
        if (state.receipts.length >= 10000)
          throw new Error('Demo receipt limit reached. Export and reset local data.');
        state.receipts.unshift({ ...receipt, receivedAt: new Date().toISOString() });
        return { receiptId: receipt.receiptId };
      });
      return json(result, 202);
    }
    if (path[0] === 'billing') {
      if (!['free', 'starter', 'growth', 'business'].includes(input.plan))
        throw new Error('Unknown plan');
      await mutateStore((state: any) => {
        state.organization.plan = input.plan;
        audit(state, 'Demo plan changed', null);
      });
      return json({ simulated: true, message: 'Demo plan updated. No payment was taken.' });
    }
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400);
  }
}
