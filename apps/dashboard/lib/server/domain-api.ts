import 'server-only';
import { withTenant, recordAudit } from './database';
import { HttpError, type Actor } from './auth';
import { createChallenge, verifyChallenge } from './domain-verification.mjs';
export async function domainStatus(actor: Actor, projectId: string) {
  return withTenant(actor, async (db) => {
    const p = (await db.query('select id,domain from accordly.projects where id=$1', [projectId]))
      .rows[0];
    if (!p) throw new HttpError(404, 'Project not found');
    const c = (
      await db.query(
        'select method,expires_at,verified_at from accordly.domain_challenges where project_id=$1 and domain=$2',
        [projectId, p.domain],
      )
    ).rows[0];
    return {
      domain: p.domain,
      verified: Boolean(
        c?.verified_at && new Date(c.verified_at).getTime() > Date.now() - 30 * 86400000,
      ),
      method: c?.method,
      expiresAt: c?.expires_at,
      verifiedAt: c?.verified_at,
    };
  });
}
export async function domainOperation(
  actor: Actor,
  projectId: string,
  operation: string,
  payload: any,
) {
  if (actor.role !== 'admin') throw new HttpError(403, 'Only administrators can verify domains');
  if (operation === 'challenge')
    return withTenant(actor, async (db) => {
      const p = (
        await db.query('select id,domain from accordly.projects where id=$1 for update', [
          projectId,
        ])
      ).rows[0];
      if (!p) throw new HttpError(404, 'Project not found');
      const old = (
        await db.query('select created_at from accordly.domain_challenges where project_id=$1', [
          projectId,
        ])
      ).rows[0];
      if (old && Date.now() - new Date(old.created_at).getTime() < 60000)
        throw new HttpError(429, 'Wait one minute before generating another challenge');
      let c;
      try {
        c = createChallenge(p.domain, payload.method);
      } catch (e) {
        throw new HttpError(400, (e as Error).message);
      }
      await db.query(
        'insert into accordly.domain_challenges(id,organization_id,project_id,domain,method,token_hash,expires_at) values($1,$2,$3,$4,$5,$6,$7) on conflict(project_id) do update set id=excluded.id,domain=excluded.domain,method=excluded.method,token_hash=excluded.token_hash,expires_at=excluded.expires_at,created_at=now(),verified_at=null,last_attempt_at=null',
        [c.id, actor.orgId, projectId, c.domain, c.method, c.tokenHash, c.expiresAt],
      );
      await recordAudit(db, actor, 'Domain challenge created', projectId);
      const { tokenHash, ...instructions } = c;
      return instructions;
    });
  if (operation !== 'verify') throw new HttpError(404, 'Not found');
  const challenge = await withTenant(actor, async (db) => {
    const result = await db.query(
      "update accordly.domain_challenges c set last_attempt_at=now() where project_id=$1 and (last_attempt_at is null or last_attempt_at<now()-interval '30 seconds') and expires_at>now() and exists(select from accordly.projects p where p.id=c.project_id and p.domain=c.domain) returning *",
      [projectId],
    );
    if (!result.rowCount)
      throw new HttpError(
        409,
        'Challenge is missing, expired, or recently checked. Wait 30 seconds or create a new challenge.',
      );
    return result.rows[0];
  });
  let matched;
  try {
    matched = await verifyChallenge({
      domain: challenge.domain,
      method: challenge.method,
      tokenHash: challenge.token_hash,
      expiresAt: challenge.expires_at,
    });
  } catch {
    throw new HttpError(
      422,
      'Ownership check failed. Check DNS propagation or the HTTPS file, then retry.',
    );
  }
  if (!matched) throw new HttpError(422, 'The published token does not match this challenge');
  await withTenant(actor, async (db) => {
    const result = await db.query(
      'update accordly.domain_challenges c set verified_at=now() where id=$1 and token_hash=$2 and expires_at>now() and exists(select from accordly.projects p where p.id=c.project_id and p.domain=c.domain) returning id',
      [challenge.id, challenge.token_hash],
    );
    if (!result.rowCount)
      throw new HttpError(
        409,
        'Challenge changed during verification. Retry with the current challenge.',
      );
    await recordAudit(db, actor, 'Domain ownership verified', projectId);
  });
  return { verified: true };
}
