import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireOrganization, HttpError, type Actor } from './auth';
import { withDatabase, withTenant, recordAudit } from './database';
import { makeConfig, parseConfig, parseProject, validateReceipt } from '../domain.mjs';
import { toBannerConfig, validateEvent } from '../contracts.mjs';
const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
async function input(req: NextRequest) {
  let size = 0;
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body required');
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) {
      await reader.cancel();
      throw new HttpError(413, 'Request too large');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}
function originCheck(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host'))
    throw new HttpError(403, 'Cross-origin administration is not allowed.');
}
function failure(error: unknown) {
  const e = error as { status?: number; code?: string };
  if (e.status && e.status >= 400 && e.status < 500)
    return json({ error: error instanceof Error ? error.message : 'Request rejected' }, e.status);
  if (e.code === '23505')
    return json({ error: 'This identifier already exists with different content.' }, 409);
  if (e.code === '42501') return json({ error: 'Access denied.' }, 403);
  if (e.code === 'P0002') return json({ error: 'Not found.' }, 404);
  console.error('Accordly operation failed', { code: e.code || 'SERVICE_UNAVAILABLE' });
  return json(
    { error: 'The operation could not complete. Check service configuration or try again.' },
    503,
  );
}
async function published(
  projectId: string,
  version: string | null = null,
  hash: string | null = null,
) {
  return withDatabase(
    async (db) =>
      (
        await db.query('select accordly.public_release($1,$2,$3) as release', [
          projectId,
          version,
          hash,
        ])
      ).rows[0].release,
  );
}
export async function liveGet(req: NextRequest, path: string[]) {
  try {
    if (path[0] === 'public' || (path[0] === 'v1' && path[1] === 'config')) {
      const projectId = path[0] === 'public' ? path[1] : path[2];
      if (!projectId) throw new HttpError(404, 'Not found');
      const release = await published(projectId, path[0] === 'public' ? path[2] || null : null);
      if (!release) throw new HttpError(404, 'Published configuration not found');
      return json(path[0] === 'public' ? release.config : release.banner, 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public,max-age=30',
      });
    }
    const actor = await requireOrganization('read');
    if (path.join('/') === 'organization/members') {
      const clerk = await clerkClient();
      const members = await clerk.organizations.getOrganizationMembershipList({
        organizationId: actor.orgId,
        limit: 100,
      });
      const invitations =
        actor.role === 'admin'
          ? await clerk.organizations.getOrganizationInvitationList({
              organizationId: actor.orgId,
              status: ['pending'],
              limit: 100,
            })
          : null;
      return json({
        canManage: actor.role === 'admin',
        userId: actor.userId,
        members: members.data.map((m) => ({
          id: m.id,
          userId: m.publicUserData?.userId,
          name:
            [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') ||
            m.publicUserData?.identifier,
          role: m.role,
        })),
        invitations:
          invitations?.data.map((i) => ({
            id: i.id,
            email: i.emailAddress,
            role: i.role,
            status: i.status,
          })) || [],
        totalMembers: members.totalCount,
      });
    }
    if (path[0] === 'export') {
      const rows = await withTenant(
        actor,
        async (db) =>
          (
            await db.query(
              'select payload,received_at from accordly.events order by received_at desc limit 10001',
            )
          ).rows,
      );
      if (rows.length > 10000)
        throw new HttpError(
          413,
          'Export exceeds 10,000 rows; use an offline tenant-scoped export.',
        );
      return new NextResponse(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            receipts: rows.map((r) => ({ ...r.payload, receivedAt: r.received_at })),
          },
          null,
          2,
        ),
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="accordly-consent-records.json"',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    if (path.join('/') === 'state')
      return json(
        await withTenant(actor, async (db) => {
          const [organization, projects, releases, events, audit, jobs] = await Promise.all([
            db.query('select * from accordly.organizations'),
            db.query('select * from accordly.projects order by created_at'),
            db.query('select * from accordly.releases order by created_at desc'),
            db.query('select * from accordly.events order by received_at desc limit 1000'),
            db.query('select * from accordly.audit_events order by created_at desc limit 100'),
            db.query('select * from accordly.deletion_jobs order by created_at desc limit 100'),
          ]);
          return {
            mode: 'live',
            viewer: { userId: actor.userId, role: actor.role },
            organization: {
              id: actor.orgId,
              name: actor.orgName,
              plan: organization.rows[0].plan,
              retentionDays: organization.rows[0].retention_days,
            },
            projects: projects.rows.map((p) => ({
              id: p.id,
              name: p.name,
              domain: p.domain,
              createdAt: p.created_at,
              draft: p.draft,
              activeRelease: p.active_release,
              releases: releases.rows
                .filter((r) => r.project_id === p.id)
                .map((r) => ({ id: r.id, config: r.config, createdAt: r.created_at })),
            })),
            receipts: events.rows.map((e) =>
              e.kind === 'legacy'
                ? { ...e.payload, receivedAt: e.received_at }
                : {
                    receiptId: e.event_id,
                    projectId: e.project_id,
                    configurationVersion: e.release_id,
                    choices: { necessary: true, ...e.payload.choices },
                    action: (
                      {
                        accept_all: 'accept',
                        reject_all: 'reject',
                        custom: 'customize',
                        update: 'customize',
                        withdraw: 'withdraw',
                      } as Record<string, string>
                    )[e.payload.action],
                    clientTimestamp: e.payload.clientTime,
                    receivedAt: e.received_at,
                  },
            ),
            audit: audit.rows.map((a) => ({
              id: a.id,
              action: a.action,
              at: a.created_at,
              actor: a.actor_id,
              projectId: a.project_id,
            })),
            deletionJobs: jobs.rows,
            recordsLimited: events.rows.length === 1000,
          };
        }),
      );
    throw new HttpError(404, 'Not found');
  } catch (e) {
    return failure(e);
  }
}
export async function livePost(req: NextRequest, path: string[]) {
  try {
    if (path.join('/') === 'v1/events' || path.join('/') === 'receipts') {
      const payload = await input(req);
      const v1 = path[0] === 'v1';
      const release = await published(
        String(payload.projectId),
        v1 ? null : payload.configurationVersion,
        v1 ? payload.configHash : null,
      );
      if (!release) throw new HttpError(404, 'Unknown configuration');
      // Origin is an abuse boundary, not a credential. Full domain verification is a separate deployment requirement.
      const origin = req.headers.get('origin');
      if (!origin || !['https://' + release.domain, 'http://' + release.domain].includes(origin))
        throw new HttpError(403, 'Website origin is not enabled for this project');
      let event;
      try {
        event = v1
          ? validateEvent(payload, release.banner)
          : validateReceipt(payload, release.config);
      } catch {
        throw new HttpError(400, 'Invalid consent event');
      }
      const duplicate = await withDatabase(
        async (db) =>
          (
            await db.query('select accordly.ingest_event($1,$2,$3,$4::jsonb) as duplicate', [
              payload.projectId,
              release.id,
              v1 ? 'v1' : 'legacy',
              JSON.stringify(event),
            ])
          ).rows[0].duplicate,
      );
      return json({ duplicate }, 202);
    }
    originCheck(req);
    const operation =
      path[0] === 'organization' || path[2] === 'delete'
        ? 'manage'
        : path[2] === 'publish' || path[2] === 'rollback'
          ? 'publish'
          : 'edit';
    const actor = await requireOrganization(operation);
    const payload = await input(req);
    if (path[0] === 'organization') return await organizationOperation(actor, path, payload);
    if (path[0] === 'billing') throw new HttpError(501, 'Live billing is not configured.');
    return json(
      await withTenant(actor, async (db) => {
        if (path[0] === 'projects' && !path[1]) {
          let values;
          try {
            values = parseProject(payload);
          } catch (e) {
            throw new HttpError(400, (e as Error).message);
          }
          const id = 'proj_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
          const draft = makeConfig(id);
          await db.query(
            'insert into accordly.projects(id,organization_id,name,domain,draft) values($1,$2,$3,$4,$5::jsonb)',
            [id, actor.orgId, values.name, values.domain, JSON.stringify(draft)],
          );
          await recordAudit(db, actor, 'Project created', id);
          return { id, ...values, draft };
        }
        if (path[0] !== 'projects' || !path[1]) throw new HttpError(404, 'Not found');
        const result = await db.query('select * from accordly.projects where id=$1 for update', [
          path[1],
        ]);
        const project = result.rows[0];
        if (!project) throw new HttpError(404, 'Project not found');
        if (path[2] === 'draft') {
          let draft;
          try {
            draft = parseConfig(payload, project.id);
          } catch (e) {
            throw new HttpError(400, (e as Error).message);
          }
          await db.query('update accordly.projects set draft=$1::jsonb where id=$2', [
            JSON.stringify(draft),
            project.id,
          ]);
          await recordAudit(db, actor, 'Draft saved', project.id);
          return { saved: true };
        }
        if (path[2] === 'publish') {
          const id = 'rel_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
          const config = { ...parseConfig(project.draft, project.id), version: id };
          const banner = await toBannerConfig(config);
          await db.query(
            'insert into accordly.releases(id,organization_id,project_id,config,banner,config_hash) values($1,$2,$3,$4::jsonb,$5::jsonb,$6)',
            [
              id,
              actor.orgId,
              project.id,
              JSON.stringify(config),
              JSON.stringify(banner),
              banner.configHash,
            ],
          );
          await db.query('select accordly.activate_release($1,$2)', [project.id, id]);
          await recordAudit(db, actor, 'Configuration published', project.id);
          return { id, config };
        }
        if (path[2] === 'rollback') {
          const release = await db.query(
            'select id from accordly.releases where id=$1 and project_id=$2',
            [payload.releaseId, project.id],
          );
          if (!release.rowCount) throw new HttpError(404, 'Release not found');
          await db.query('select accordly.activate_release($1,$2)', [
            project.id,
            payload.releaseId,
          ]);
          await recordAudit(db, actor, 'Release restored', project.id);
          return { restored: true };
        }
        if (path[2] === 'delete') {
          await db.query(
            'insert into accordly.deletion_jobs(organization_id,project_id) values($1,$2)',
            [actor.orgId, project.id],
          );
          await recordAudit(db, actor, 'Project deletion requested', project.id);
          return { queued: true };
        }
        throw new HttpError(404, 'Not found');
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
async function organizationOperation(actor: Actor, path: string[], payload: any) {
  if (path[1] === 'retention') {
    if (!Number.isInteger(payload.days) || payload.days < 1 || payload.days > 395)
      throw new HttpError(400, 'Retention must be 1–395 days');
    await withTenant(actor, async (db) => {
      await db.query('update accordly.organizations set retention_days=$1 where id=$2', [
        payload.days,
        actor.orgId,
      ]);
      await recordAudit(db, actor, 'Retention policy updated');
    });
    return json({ saved: true });
  }
  const clerk = await clerkClient();
  const roles: Record<string, string> = {
    admin: 'org:admin',
    editor: 'org:editor',
    viewer: 'org:member',
  };
  if (path[1] === 'invitations' && !path[2]) {
    if (
      typeof payload.email !== 'string' ||
      payload.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
      !roles[payload.role]
    )
      throw new HttpError(400, 'Provide a valid email address and role');
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: actor.orgId,
      emailAddress: payload.email,
      role: roles[payload.role],
      inviterUserId: actor.userId,
    });
    await withTenant(actor, (db) => recordAudit(db, actor, 'Organization invitation created'));
    return json({ id: invitation.id });
  }
  if (path[1] === 'invitations' && path[2] && path[3] === 'revoke') {
    await clerk.organizations.revokeOrganizationInvitation({
      organizationId: actor.orgId,
      invitationId: path[2],
      requestingUserId: actor.userId,
    });
    await withTenant(actor, (db) => recordAudit(db, actor, 'Organization invitation revoked'));
    return json({ revoked: true });
  }
  if (path[1] === 'members' && path[2]) {
    if (path[2] === actor.userId)
      throw new HttpError(400, 'Use another administrator to change your own membership.');
    if (path[3] === 'role' && roles[payload.role])
      await clerk.organizations.updateOrganizationMembership({
        organizationId: actor.orgId,
        userId: path[2],
        role: roles[payload.role],
      });
    else if (path[3] === 'remove')
      await clerk.organizations.deleteOrganizationMembership({
        organizationId: actor.orgId,
        userId: path[2],
      });
    else throw new HttpError(400, 'Unknown membership operation');
    await withTenant(actor, (db) => recordAudit(db, actor, 'Organization membership changed'));
    return json({ saved: true });
  }
  throw new HttpError(404, 'Not found');
}
