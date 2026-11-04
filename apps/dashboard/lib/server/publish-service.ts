import 'server-only';
import { withTenant, recordAudit } from './database';
import { HttpError, type Actor } from './auth';
import { parseConfig } from '../domain.mjs';
import { toBannerConfig } from '../contracts.mjs';
import { publishTransport } from './publish-transport.mjs';
import { publishStep } from './publish-step.mjs';

export async function publishRelease(
  actor: Actor,
  projectId: string,
  payload: any,
  rollback = false,
) {
  if (actor.role !== 'admin') throw new HttpError(403, 'Administrator required');
  const transport = publishTransport(); // Fail before creating a job if deployment is incomplete.
  const requestedId = payload.requestId;
  if (requestedId && !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(requestedId))
    throw new HttpError(400, 'requestId must be a UUID');
  const jobId = await withTenant(actor, async (db) => {
    const project = (
      await db.query('select * from accordly.projects where id=$1 for update', [projectId])
    ).rows[0];
    if (!project) throw new HttpError(404, 'Project not found');
    if (requestedId) {
      const existing = (
        await db.query('select * from accordly.publish_jobs where id=$1', [requestedId])
      ).rows[0];
      if (existing) {
        if (
          existing.project_id !== projectId ||
          (rollback && existing.release_id !== payload.releaseId)
        )
          throw new HttpError(409, 'Idempotency key already used');
        return existing.id;
      }
    }
    const pending = (
      await db.query(
        "select id,release_id from accordly.publish_jobs where project_id=$1 and phase<>'completed'",
        [projectId],
      )
    ).rows[0];
    if (pending) {
      if (rollback && pending.release_id !== payload.releaseId)
        throw new HttpError(
          409,
          `Complete pending publish ${pending.id} before restoring a different release`,
        );
      if (requestedId && pending.id !== requestedId)
        throw new HttpError(409, `Resume pending publish with requestId ${pending.id}`);
      return pending.id;
    }
    const proof = (
      await db.query(
        "select verified_at + interval '30 days' as until from accordly.domain_challenges where project_id=$1 and domain=$2 and verified_at>now()-interval '30 days'",
        [projectId, project.domain],
      )
    ).rows[0];
    if (!proof) throw new HttpError(409, 'Verify domain ownership before publishing');
    let releaseId: string;
    if (rollback) {
      const release = (
        await db.query('select id from accordly.releases where project_id=$1 and id=$2', [
          projectId,
          payload.releaseId,
        ])
      ).rows[0];
      if (!release) throw new HttpError(404, 'Release not found');
      releaseId = release.id;
    } else {
      releaseId = 'rel_' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
      const config = { ...parseConfig(project.draft, projectId), version: releaseId };
      const banner = await toBannerConfig(config);
      await db.query(
        'insert into accordly.releases(id,organization_id,project_id,config,banner,config_hash) values($1,$2,$3,$4::jsonb,$5::jsonb,$6)',
        [
          releaseId,
          actor.orgId,
          projectId,
          JSON.stringify(config),
          JSON.stringify(banner),
          banner.configHash,
        ],
      );
    }
    const id = requestedId || crypto.randomUUID();
    await db.query(
      'insert into accordly.publish_jobs(id,organization_id,project_id,release_id,domain,verified_until) values($1,$2,$3,$4,$5,$6)',
      [id, actor.orgId, projectId, releaseId, project.domain, proof.until],
    );
    return id;
  });
  try {
    for (;;) {
      const result = await withTenant(actor, async (db) => {
        // Serialize each step with project edits, rollback and other publish requests.
        const project = (
          await db.query('select * from accordly.projects where id=$1 for update', [projectId])
        ).rows[0];
        const job = (
          await db.query(
            'select j.*,r.config,r.banner from accordly.publish_jobs j join accordly.releases r on r.id=j.release_id where j.id=$1 and j.project_id=$2 for update of j',
            [jobId, projectId],
          )
        ).rows[0];
        if (!project || !job) throw new HttpError(404, 'Publish job not found');
        if (job.phase === 'completed')
          return {
            jobId,
            id: job.release_id,
            config: job.config,
            restored: rollback,
            completed: true,
          };
        const proof = (
          await db.query(
            "select verified_at + interval '30 days' as until from accordly.domain_challenges where project_id=$1 and domain=$2 and verified_at>now()-interval '30 days'",
            [projectId, job.domain],
          )
        ).rows[0];
        if (project.domain !== job.domain || !proof)
          throw new HttpError(
            409,
            'Publish proof changed or expired; restore domain verification before retrying',
          );
        if (new Date(job.verified_until).getTime() <= Date.now()) {
          // A renewed ownership proof gets a new fence; an old delayed pointer cannot win.
          const renewed = (
            await db.query(
              "update accordly.publish_jobs set verified_until=$2,generation=default,phase='validated' where id=$1 returning *",
              [jobId, proof.until],
            )
          ).rows[0];
          Object.assign(job, renewed);
        }
        const next = await publishStep(job, transport, async () => {
          await db.query('select accordly.activate_release($1,$2)', [projectId, job.release_id]);
          await recordAudit(
            db,
            actor,
            `Configuration published: ${job.release_id} (job ${jobId})`,
            projectId,
          );
        });
        await db.query(
          "update accordly.publish_jobs set phase=$2,last_error=null,attempts=attempts+1,completed_at=case when $2='completed' then now() else null end where id=$1",
          [jobId, next],
        );
        return null;
      });
      if (result) return result;
    }
  } catch (error) {
    await withTenant(actor, (db) =>
      db.query(
        "update accordly.publish_jobs set attempts=attempts+1,last_error='Dependency or ownership check failed; retry this job' where id=$1 and phase<>'completed'",
        [jobId],
      ),
    ).catch(() => {});
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      409,
      `Publish ${jobId} is pending. Retry with the same requestId to resume.`,
    );
  }
}
